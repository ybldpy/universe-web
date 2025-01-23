// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: './index.html', // 主入口
                page1: './evolution.html',   // 其他页面
                page2: './digitalUniverse.html'
            }
        },
        outDir: 'dist',  // 打包输出目录
    },



    plugins:[vue(),AutoImport({resolvers:[ElementPlusResolver()]}),
            Components({resolvers:ElementPlusResolver()})]
});