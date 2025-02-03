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
                main: './src/templates/dataManagement.html'// 主入口
            }
        },
        outDir: 'dist',  // 打包输出目录
    },



    plugins:[vue(),AutoImport({resolvers:[ElementPlusResolver()]}),
            Components({resolvers:ElementPlusResolver()})]
});