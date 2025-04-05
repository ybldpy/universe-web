import * as THREE from "three";
import {RenderableObject} from "../rendering/base";
import {NEAR_PLANE,FAT_PLANE} from "../rendering/common";
import {appContext} from "../applicationContext";

export class PlanetAtmosphere extends RenderableObject{


    static vs = `
    precision highp float;
    out vec2 vUV;
    void main(){
        gl_Position = vec4(position,1.0);
        vUV = uv;
    }
    `


    static fs3 = `
    #define PI 3.1415926535897932
    #define POINTS_FROM_CAMERA 10 // number sample points along camera ray
    #define OPTICAL_DEPTH_POINTS 10 // number sample points along light ray

    out vec4 outputColor;

    // varying
    in vec2 vUV; // screen coordinates


    // uniforms
    uniform sampler2D textureSampler; // the original screen texture
    uniform sampler2D depthSampler; // the depth map of the camera

    uniform vec3 sunPosition; // position of the sun in world space
    uniform vec3 cameraPos; // position of the camera in world space

    uniform sampler2D gPositionTexture;
    uniform sampler2D screenColorTexture;

    uniform mat4 inverseProjection; // camera's inverse projection matrix
    uniform mat4 inverseView; // camera's inverse view matrix

    uniform float cameraNear; // camera minZ
    uniform float cameraFar; // camera maxZ

    uniform vec3 planetPosition; // planet position in world space
    uniform float planetRadius; // planet radius for height calculations
    uniform float atmosphereRadius; // atmosphere radius (calculate from planet center)

    uniform float falloffFactor; // controls exponential opacity falloff
    uniform float sunIntensity; // controls atmosphere overall brightness
    uniform float scatteringStrength; // controls color dispersion
    uniform float densityModifier; // density of the atmosphere

    uniform float redWaveLength; // the wave length for the red part of the scattering
    uniform float greenWaveLength; // same with green
    uniform float blueWaveLength; // same with blue

    // remap a value comprised between low1 and high1 to a value between low2 and high2
    float remap(float value, float low1, float high1, float low2, float high2) {
        return low2 + (value - low1) * (high2 - low2) / (high1 - low1);
    }

    // compute the world position of a pixel from its uv coordinates and depth
    vec3 worldFromUV(vec2 UV, float depth) {
        vec4 ndc = vec4(UV * 2.0 - 1.0, 0.0, 1.0); // normalized device coordinates for only the UV
        vec4 posVS = inverseProjection * ndc; // unproject the pixel to view space
        posVS.xyz *= remap(depth, 0.0, 1.0, cameraNear, cameraFar); // now account for the depth (we can't do it before because of the perspective projection being non uniform)
        vec4 posWS = inverseView * vec4(posVS.xyz, 1.0); // unproject the point to world space
        return posWS.xyz;
    }


    // returns whether or not a ray hits a sphere, if yes out intersection points
    // a good explanation of how it works : https://viclw17.github.io/2018/07/16/raytracing-ray-sphere-intersection
    bool rayIntersectSphere(vec3 rayOrigin, vec3 rayDir, vec3 spherePosition, float sphereRadius, out float t0, out float t1) {
        vec3 relativeOrigin = rayOrigin - spherePosition; // rayOrigin in sphere space

        float a = 1.0;
        float b = 2.0 * dot(relativeOrigin, rayDir);
        float c = dot(relativeOrigin, relativeOrigin) - sphereRadius*sphereRadius;
        
        float d = b*b - 4.0*a*c;

        if(d < 0.0) return false; // no intersection

        float r0 = (-b - sqrt(d)) / (2.0*a);
        float r1 = (-b + sqrt(d)) / (2.0*a);

        t0 = min(r0, r1);
        t1 = max(r0, r1);

        return (t1 >= 0.0);
    }

    // based on https://www.youtube.com/watch?v=DxfEbulyFcY by Sebastian Lague
    float densityAtPoint(vec3 densitySamplePoint) {
        float heightAboveSurface = length(densitySamplePoint - planetPosition) - planetRadius; // actual height above surface
        float height01 = heightAboveSurface / (atmosphereRadius - planetRadius); // normalized height between 0 and 1
        
        float localDensity = densityModifier * exp(-height01 * falloffFactor); // density with exponential falloff
        localDensity *= (1.0 - height01); // make it 0 at maximum height

        return localDensity;
    }

    float opticalDepth(vec3 rayOrigin, vec3 rayDir, float rayLength) {

        float stepSize = rayLength / (float(OPTICAL_DEPTH_POINTS) - 1.0); // ray length between sample points
        
        vec3 densitySamplePoint = rayOrigin; // that's where we start
        float accumulatedOpticalDepth = 0.0;

        for(int i = 0 ; i < OPTICAL_DEPTH_POINTS ; i++) {
            float localDensity = densityAtPoint(densitySamplePoint); // we get the density at the sample point

            accumulatedOpticalDepth += localDensity * stepSize; // linear approximation : density is constant between sample points

            densitySamplePoint += rayDir * stepSize; // we move the sample point
        }

        return accumulatedOpticalDepth;
    }

    vec3 calculateLight(vec3 rayOrigin, vec3 rayDir, float rayLength) {

        vec3 samplePoint = rayOrigin; // first sampling point coming from camera ray

        vec3 sunDir = normalize(sunPosition - planetPosition); // direction to the light source
        
        vec3 wavelength = vec3(redWaveLength, greenWaveLength, blueWaveLength); // the wavelength that will be scattered (rgb so we get everything)
        vec3 scatteringCoeffs = pow(1063.0 / wavelength.xyz, vec3(4.0)) * scatteringStrength; // the scattering is inversely proportional to the fourth power of the wave length;
        // about the 1063, it is just a constant that makes the scattering look good
        scatteringCoeffs /= planetRadius; // Scale invariance by Yincognyto https://github.com/BarthPaleologue/volumetric-atmospheric-scattering/issues/6#issuecomment-1432409930

        float stepSize = rayLength / (float(POINTS_FROM_CAMERA) - 1.0); // the ray length between sample points

        vec3 inScatteredLight = vec3(0.0); // amount of light scattered for each channel

        for (int i = 0 ; i < POINTS_FROM_CAMERA ; i++) {

            float sunRayLengthInAtm = atmosphereRadius - length(samplePoint - planetPosition); // distance traveled by light through atmosphere from light source
            float t0, t1;
            if(rayIntersectSphere(samplePoint, sunDir, planetPosition, atmosphereRadius, t0, t1)) {
                sunRayLengthInAtm = t1;
            }

            float sunRayOpticalDepth = opticalDepth(samplePoint, sunDir, sunRayLengthInAtm); // scattered from the sun to the point
            
            float viewRayLengthInAtm = stepSize * float(i); // distance traveled by light through atmosphere from sample point to cameraPosition
            float viewRayOpticalDepth = opticalDepth(samplePoint, -rayDir, viewRayLengthInAtm); // scattered from the point to the camera
            
            vec3 transmittance = exp(-(sunRayOpticalDepth + viewRayOpticalDepth) * scatteringCoeffs); // exponential scattering with coefficients
            
            float localDensity = densityAtPoint(samplePoint); // density at sample point

            inScatteredLight += localDensity * transmittance * scatteringCoeffs * stepSize; // add the resulting amount of light scattered toward the camera
            
            samplePoint += rayDir * stepSize; // move sample point along view ray
        }

        // scattering depends on the direction of the light ray and the view ray : it's the rayleigh phase function
        // https://glossary.ametsoc.org/wiki/Rayleigh_phase_function
        float costheta = dot(rayDir, sunDir);
        float phaseRayleigh = 3.0 / (16.0 * PI) * (1.0 + costheta * costheta);
        
        inScatteredLight *= phaseRayleigh; // apply rayleigh pahse
        inScatteredLight *= sunIntensity; // multiply by the intensity of the sun

        return inScatteredLight;
    }

    vec3 scatter(vec3 originalColor, vec3 rayOrigin, vec3 rayDir, float maximumDistance) {
        float impactPoint, escapePoint;
        if (!(rayIntersectSphere(rayOrigin, rayDir, planetPosition, atmosphereRadius, impactPoint, escapePoint))) {
            
            return originalColor; // if not intersecting with atmosphere, return original color
        }

        impactPoint = max(0.0, impactPoint); // cannot be negative (the ray starts where the camera is in such a case)
        escapePoint = min(maximumDistance, escapePoint); // occlusion with other scene objects

        float distanceThroughAtmosphere = max(0.0, escapePoint - impactPoint); // probably doesn't need the max but for the sake of coherence the distance cannot be negative
        
        vec3 firstPointInAtmosphere = rayOrigin + rayDir * impactPoint; // the first atmosphere point to be hit by the ray

        vec3 light = calculateLight(firstPointInAtmosphere, rayDir, distanceThroughAtmosphere); // calculate scattering
        
        return originalColor * (1.0 - light) + light; // blending scattered color with original color
    }


    void main() {
        vec3 screenColor = texture2D(screenColorTexture, vUV).rgb;
        //float depth = texture2D(depthSampler, vUV).r; // the depth corresponding to the pixel in the depth map
        
        // deepest physical point from the camera in the direction of the pixel (occlusion)
        // if there is no occlusion, the deepest point is on the far plane
        vec4 gPos = texture2D(gPositionTexture,vUV);
        vec3 worldPos = vec3(0.0);
        if(gPos.w>0.0){worldPos = worldFromUV(vUV,1.0);}
        //worldPos = worldFromUV(vUV,1.0);
        else {worldPos = vec3(inverseView * vec4(gPos.xyz,1.0));}
        vec3 deepestPoint = worldPos - cameraPos;
        
        float maximumDistance = length(deepestPoint); // the maxium ray length due to occlusion

        vec3 rayDir = deepestPoint / maximumDistance; // normalized direction of the ray

        // this will account for the non perfect sphere shape of the planet
        // as t0 is exactly the distance to the planet, while maximumDistance suffers from the 
        // imperfect descretized and periodic geometry of the sphere
        // DO NOT USE IF your planet has landmasses
        float t0, t1;
        if(rayIntersectSphere(cameraPos, rayDir, planetPosition, planetRadius, t0, t1)) {
            if(maximumDistance > t0 - 1.0) maximumDistance = t0; // the -1.0 is to avoid some imprecision artifacts
        }
        vec3 finalColor = scatter(screenColor, cameraPos, rayDir, maximumDistance); // the color to be displayed on the screen
        float d = 1.0;
        outputColor = vec4(finalColor,1.0); // displaying the final color
        //outputColor = vec4(1.0,0.0,0.0,1.0);
        //outputColor = vec4(gPos.xyz/d,1.0);
        
    }
    
    
    
    
    
    `


    constructor({radius=10,planetRadius=10,intensity = 15,scatteringStrengh = 2,falloff = 15,density = 3,redWave = 800,blueWave = 565,greenWave = 700}){
        super()
        this.radius = radius;
        this.atmosphere = null;
        this.props = {
            fallOff:falloff,
            sunIntensity:intensity,
            scatteringStrength:scatteringStrengh,
            density:density,
            visible:true,
        }
        this.shader = new THREE.ShaderMaterial({
            vertexShader:PlanetAtmosphere.vs,
            fragmentShader:PlanetAtmosphere.fs3,
            glslVersion:THREE.GLSL3,
            // transparent:true,
            uniforms:{
                gPositionTexture:{value:null},
                screenColorTexture:{value:null},
                sunPosition:{value:new THREE.Vector3(0.0,0.0,0.0)},
                cameraPos:{value:new THREE.Vector3()},
                inverseProjection:{value:new THREE.Matrix4()},
                inverseView:{value:new THREE.Matrix4()},
                cameraNear:{value:NEAR_PLANE},
                cameraFar:{value:FAT_PLANE},
                planetPosition:{value:new THREE.Vector3()},
                planetRadius:{value:planetRadius},
                atmosphereRadius:{value:this.radius},
                falloffFactor:{value:falloff},
                sunIntensity:{value:20.0},
                scatteringStrength:{value:scatteringStrengh},
                densityModifier:{value:density},
                redWaveLength:{value:redWave},
                greenWaveLength:{value:greenWave},
                blueWaveLength:{value:blueWave}
            },
        })

    }
    getModelTransform(){
        return this.parent.getModelTransform();
    }
    getPosition(){
        return this.parent.getPosition();
    }



    addUIComponent(uiComponent) {
        const keys = Object.keys(this.props);
        for(let i = 0;i<keys.length;i++){
            uiComponent.add(this.props,keys[i])
        }
    }



    getProps() {
        return this.props
    }


    render(renderData,postProcessShaderQueue){
        if (!this.props.visible){return;}



        const uniforms = this.shader.uniforms;
        const camera = renderData.camera;
        //uniforms.sunPosition.value.copy(camera.position);
        uniforms.cameraPos.value.copy(camera.position);
        uniforms.inverseProjection.value.copy(camera.projectionMatrix.clone().invert());
        uniforms.inverseView.value.copy(camera.matrixWorldInverse.clone().invert());
        uniforms.cameraNear.value = 0.1
        uniforms.cameraFar.value = 1e15;
        uniforms.scatteringStrength.value = this.props.scatteringStrength;
        uniforms.falloffFactor.value = this.props.fallOff;
        uniforms.sunIntensity.value = this.props.sunIntensity;
        uniforms.densityModifier.value = this.props.density;
        const translation = renderData.transformation.translation;
        uniforms.planetPosition.value.set(translation.x,translation.y,translation.z)
        // uniforms.sunIntensity.value = atmosphereUI.intensity;
        // uniforms.scatteringStrength.value = atmosphereUI.scatteringStrength;
        // uniforms.falloffFactor.value = atmosphereUI.falloff;
        // uniforms.densityModifier.value = atmosphereUI.density;
        // uniforms.redWaveLength.value = atmosphereUI.redWave;
        // uniforms.blueWaveLength.value = atmosphereUI.blueWave;
        // uniforms.greenWaveLength.value = atmosphereUI.greenWave;


        const sunPosition = appContext.scene.findNodeByIdentifier("sun").getLocalPosition();
        this.shader.uniforms.sunPosition.value.set(sunPosition.x,sunPosition.y,sunPosition.z);
        postProcessShaderQueue.push(this.shader);
    }
}