// vite.config.js
import { defineConfig } from 'vite';

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
});