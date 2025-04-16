import * as THREE from "three"
import {RenderableObject,RenderData,UpdateData} from "../rendering/base";
import {GLSL3, ShaderMaterial} from "three";
import {appContext} from "../applicationContext";
import {commonFunctionsInclude} from "../rendering/common";
import { Line2} from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import {LineMaterial} from "three/addons";


export class RenderableOrbit extends RenderableObject{



    static vertexShader=
        /* glsl */`

        
		#include <common>
		#include <color_pars_vertex>
		#include <fog_pars_vertex>
		#include <logdepthbuf_pars_vertex>
		#include <clipping_planes_pars_vertex>

		uniform float linewidth;
		uniform vec2 resolution;
		uniform float radius;

		attribute vec3 instanceStart;
		attribute vec3 instanceEnd;

		attribute vec3 instanceColorStart;
		attribute vec3 instanceColorEnd;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif
		
		varying float vsDepth;

		#ifdef USE_DASH

			uniform float dashScale;
			attribute float instanceDistanceStart;
			attribute float instanceDistanceEnd;
			varying float vLineDistance;

		#endif

		void trimSegment( const in vec4 start, inout vec4 end ) {

			// trim end segment so it terminates between the camera plane and the near plane

			// conservative estimate of the near plane
			float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
			float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
			float nearEstimate = - 0.5 * b / a;

			float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

			end.xyz = mix( start.xyz, end.xyz, alpha );

		}

		void main() {
		    
		    

			#ifdef USE_COLOR

				vColor.xyz = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

			#endif

			#ifdef USE_DASH

				vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
				vUv = uv;

			#endif

			float aspect = resolution.x / resolution.y;

			// camera space
			vec4 start = modelViewMatrix * vec4( instanceStart*radius, 1.0 );
			vec4 end = modelViewMatrix * vec4( instanceEnd*radius, 1.0 );

			#ifdef WORLD_UNITS

				worldStart = start.xyz;
				worldEnd = end.xyz;

			#else

				vUv = uv;

			#endif

			// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
			// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
			// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
			// perhaps there is a more elegant solution -- WestLangley

			bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

			if ( perspective ) {

				if ( start.z < 0.0 && end.z >= 0.0 ) {

					trimSegment( start, end );

				} else if ( end.z < 0.0 && start.z >= 0.0 ) {

					trimSegment( end, start );

				}

			}

			// clip space
			vec4 clipStart = projectionMatrix * start;
			vec4 clipEnd = projectionMatrix * end;

			// ndc space
			vec3 ndcStart = clipStart.xyz / clipStart.w;
			vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

			// direction
			vec2 dir = ndcEnd.xy - ndcStart.xy;

			// account for clip-space aspect ratio
			dir.x *= aspect;
			dir = normalize( dir );

			#ifdef WORLD_UNITS

				vec3 worldDir = normalize( end.xyz - start.xyz );
				vec3 tmpFwd = normalize( mix( start.xyz, end.xyz, 0.5 ) );
				vec3 worldUp = normalize( cross( worldDir, tmpFwd ) );
				vec3 worldFwd = cross( worldDir, worldUp );
				worldPos = position.y < 0.5 ? start: end;

				// height offset
				float hw = linewidth * 0.5;
				worldPos.xyz += position.x < 0.0 ? hw * worldUp : - hw * worldUp;

				// don't extend the line if we're rendering dashes because we
				// won't be rendering the endcaps
				#ifndef USE_DASH

					// cap extension
					worldPos.xyz += position.y < 0.5 ? - hw * worldDir : hw * worldDir;

					// add width to the box
					worldPos.xyz += worldFwd * hw;

					// endcaps
					if ( position.y > 1.0 || position.y < 0.0 ) {

						worldPos.xyz -= worldFwd * 2.0 * hw;

					}

				#endif

				// project the worldpos
				vec4 clip = projectionMatrix * worldPos;

				// shift the depth of the projected points so the line
				// segments overlap neatly
				vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
				clip.z = clipPose.z * clip.w;

			#else

				vec2 offset = vec2( dir.y, - dir.x );
				// undo aspect ratio adjustment
				dir.x /= aspect;
				offset.x /= aspect;

				// sign flip
				if ( position.x < 0.0 ) offset *= - 1.0;

				// endcaps
				if ( position.y < 0.0 ) {

					offset += - dir;

				} else if ( position.y > 1.0 ) {

					offset += dir;

				}

				// adjust for linewidth
				offset *= linewidth;

				// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
				offset /= resolution.y;

				// select end
				vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

				// back to clip space
				offset *= clip.w;

				clip.xy += offset;

			#endif

			gl_Position = clip;
			gl_Position.z = 0.0;
			vsDepth = clip.w;
			vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

			//#include <logdepthbuf_vertex>
			//#include <clipping_planes_vertex>
			//#include <fog_vertex>

		}
		`;

    static fragmentShader =
        /* glsl */`




        //#define varying in;
		uniform vec3 diffuse;
		uniform float opacity;
		uniform float linewidth;
		
		varying float vsDepth;
		
		
	
		layout(location = 1) out vec4 gPosition;
        layout(location = 0) out vec4 fragColor;
        
        ${commonFunctionsInclude}
		
		
		
		#ifdef USE_DASH

			uniform float dashOffset;
			uniform float dashSize;
			uniform float gapSize;

		#endif

		varying float vLineDistance;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#include <common>
		#include <color_pars_fragment>
		#include <fog_pars_fragment>
		#include <logdepthbuf_pars_fragment>
		#include <clipping_planes_pars_fragment>

		vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

			float mua;
			float mub;

			vec3 p13 = p1 - p3;
			vec3 p43 = p4 - p3;

			vec3 p21 = p2 - p1;

			float d1343 = dot( p13, p43 );
			float d4321 = dot( p43, p21 );
			float d1321 = dot( p13, p21 );
			float d4343 = dot( p43, p43 );
			float d2121 = dot( p21, p21 );

			float denom = d2121 * d4343 - d4321 * d4321;

			float numer = d1343 * d4321 - d1321 * d4343;

			mua = numer / denom;
			mua = clamp( mua, 0.0, 1.0 );
			mub = ( d1343 + d4321 * ( mua ) ) / d4343;
			mub = clamp( mub, 0.0, 1.0 );

			return vec2( mua, mub );

		}

		void main() {

			//#include <clipping_planes_fragment>
			gl_FragDepth = calculateLogDepth(vsDepth);

			#ifdef USE_DASH

				if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

				if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

			#endif

			float alpha = opacity;

			#ifdef WORLD_UNITS

				// Find the closest points on the view ray and the line segment
				vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
				vec3 lineDir = worldEnd - worldStart;
				vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

				vec3 p1 = worldStart + lineDir * params.x;
				vec3 p2 = rayEnd * params.y;
				vec3 delta = p1 - p2;
				float len = length( delta );
				float norm = len / linewidth;

				#ifndef USE_DASH

					#ifdef USE_ALPHA_TO_COVERAGE

						float dnorm = fwidth( norm );
						alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

					#else

						if ( norm <1.0 ) {

							//discard;

						}

					#endif

				#endif

			#else

				#ifdef USE_ALPHA_TO_COVERAGE

					// artifacts appear on some hardware if a derivative is taken within a conditional
					float a = vUv.x;
					float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
					float len2 = a * a + b * b;
					float dlen = fwidth( len2 );

					if ( abs( vUv.y ) > 1.0 ) {

						alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

					}

				#else

					if ( abs( vUv.y ) > 1.0 ) {

						float a = vUv.x;
						float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
						float len2 = a * a + b * b;

						if ( len2 > 1.0 ) discard;

					}

				#endif

			#endif

			vec4 diffuseColor = vec4( diffuse, alpha );

			//#include <logdepthbuf_fragment>
			//#include <color_fragment>

			fragColor = diffuseColor;
			gPosition = vec4(1.0);
			//#include <tonemapping_fragment>
			//#include <colorspace_fragment>
			//#include <fog_fragment>
			//#include <premultiplied_alpha_fragment>

		}
		`







    static orbitSegments = 256;


    static vs = `
    
    highp float;
   
    out float vsDepth;
    uniform float radius;
    
    
    
    ${commonFunctionsInclude}
    void main(){
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position * radius,1.0);
        vsDepth = gl_Position.w;
        // gl_PointSize = 10.0;
        gl_Position.z = 0.0;
    }
    `



    static fs = `
    highp float;
    in float vsDepth;
    
    layout(location = 1) out vec4 gPosition;
    layout(location = 0) out vec4 fragColor;
    
    
    
    ${commonFunctionsInclude}
    
    uniform vec4 orbitColor;
    
    void main(){
    
        //gl_FragDepth = calculateLogDepth(vsDepth);
        fragColor = orbitColor;
        gPosition = vec4(1.0);
    
    }
    
    
    
    
    `



    buildShaders(){
        const material = new THREE.ShaderMaterial({
            glslVersion:THREE.GLSL3,
            fragmentShader:RenderableOrbit.fragmentShader,
            vertexShader:RenderableOrbit.vertexShader,
            uniforms:{
                orbitColor:{value:new THREE.Vector4(1.0,1.0,1.0,1.0)},
                radius:{value:0},
                linewidth:{value:2.5},
                resolution:{value:new THREE.Vector2(1,1)},
                diffuse:{value:new THREE.Vector3()},
                opacity:{value:0.90}
            },
            side:THREE.DoubleSide
        })


        return material;

    }



    constructor(orbitTarget,orbitColor = 0xADD8E6) {
        super();
        this.orbitNode = appContext.scene.findNodeByIdentifier(orbitTarget);
        this.orbitColor = orbitColor;
        this.init = true;
        const points = [];
        for (let i = 0; i <= RenderableOrbit.orbitSegments; i++) {
            const theta = (i / RenderableOrbit.orbitSegments) * Math.PI * 2;
            points.push(Math.cos(theta), 0,Math.sin(theta));
        }

        // const buffer = new THREE.BufferGeometry().setFromPoints(points);
        const buffer = new LineGeometry();
        buffer.setPositions(points);





        // const material = new THREE.ShaderMaterial({
        //     glslVersion:THREE.GLSL3,
        //     fragmentShader:RenderableOrbit.fs,
        //     vertexShader:RenderableOrbit.vertexShader,
        //     uniforms:{
        //         orbitColor:{value:new THREE.Vector4(1.0,1.0,1.0,1.0)},
        //         radius:{value:0},
        //         linewidth:{value:100},
        //         resolution:{value:new THREE.Vector2(1,1)}
        //     },
        //     side:THREE.DoubleSide
        // })

        const material = this.buildShaders();
        const shader = new LineMaterial({linewidth: 10,worldUnits:true});
        // material.onBeforeCompile=(s)=>{
        //     let frag = s.fragmentShader;
        //     frag = `
        //
        //         #define varying in;
        //
        //         layout(location = 1) varying vec4 gPosition;
        //         //layout(location = 0) out vec4 fragColor;
        //     `+frag;
        //     frag = frag.replace("gl_FragColor = vec4( diffuseColor.rgb, alpha );","gl_FragColor = vec4( diffuseColor.rgb, alpha );\ngPosition=vec4(1.0);\n")
        //     s.fragmentShader = frag;
        //
        //     let vs ="#define attribute in;\n#define varying out;\n" + s.vertexShader;
        //     s.vertexShader = vs;
        //
        //
        //
        // }
        this.orbitRing = new Line2(buffer,material);
        this.orbitRing.frustumCulled = false;
    }


    convertColorToRGB(color){
        const r = (color >> 16) & 0xff;
        const g = (color >> 8) & 0xff;
        const b = color & 0xff;
        return new THREE.Vector4(r,g,b).divideScalar(255);
    }

    update(updateData) {
        this.orbitRing.material.uniforms.diffuse.value.copy(this.convertColorToRGB(this.orbitColor));
        this.orbitRing.material.uniforms.radius.value = this.orbitNode.getLocalPosition()
            .clone().sub(updateData.transformation.translation).length();
    }

    render(renderData) {


        if (this.init){
            this.init = false;
            renderData.scene.add(this.orbitRing);
        }
        const translation = renderData.transformation.translation;
        this.orbitRing.position.set(translation.x,translation.y,translation.z);
    }


}