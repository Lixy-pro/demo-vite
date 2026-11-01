import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { viteMockServe } from 'vite-plugin-mock';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
        plugins: [
            react(),
            viteMockServe({
                mockPath: './_mock',
                enable: true,
            }),
        ],
        server: {
            proxy: {
                '/api': {
                    target: env.VITE_API_TARGET,
                    changeOrigin: true,
                    // rewrite: p => p.replace(/^\/api/, ''),
                },
            },
        },
        preview: {
            port: 8080, // 默认 4173
            host: true, // 监听所有网卡（局域网可访问）
            open: true, // 启动后自动打开浏览器
            strictPort: true, // 端口被占用时报错，不自动换端口
            cors: true, // 允许跨域
        },
        build: {
            rolldownOptions: {
                output: {
                    entryFileNames: 'js/[name]-[hash].js',
                    chunkFileNames: 'js/[name]-[hash].js',
                    // assetFileNames: 'css/[name]-[hash][extname]',
                    assetFileNames(assetInfo) {
                        const name = assetInfo.names[0] ?? assetInfo.name ?? '';

                        if (name.endsWith('.css')) {
                            return 'css/[name]-[hash][extname]';
                        }
                        const imgExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp'];
                        if (imgExts.some(ext => name.endsWith(ext))) {
                            return 'img/[name]-[hash][extname]';
                        }
                        return 'asset/[name]-[hash][extname]';
                    },
                },
            },
        },
    };
});
