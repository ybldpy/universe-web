// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
export default defineConfig({




    publicDir:"./src/templates",
    server:{
        historyApiFallback:true
    },
    build: {
        rollupOptions: {
            input: {
                // 主入口
                index:"./src/templates/index.html",
                digitalUniverse:"./src/templates/digitalUniverse.html",
                dataManagement:"./src/templates/dataManagement.html",
                evolution:"./src/templates/evolution.html",
                login:"./src/templates/login.html",
                register:"./src/templates/register.html"
            },
        },
        outDir: 'dist',  // 打包输出目录
    },



    plugins:[vue(),AutoImport({resolvers:[ElementPlusResolver()]}),
            Components({resolvers:ElementPlusResolver()})]
});