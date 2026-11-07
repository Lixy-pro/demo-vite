import react from '@vitejs/plugin-react'; // React 插件：提供 JSX / TSX 支持、HMR、Fast Refresh
import { defineConfig, loadEnv } from 'vite'; // defineConfig：提供配置类型提示；loadEnv：手动加载 .env 文件
import { viteMockServe } from 'vite-plugin-mock'; // 本地 Mock 数据插件

// https://vite.dev/config/
/**
 * Vite 配置文件
 * - 使用函数形式，可根据当前运行模式（development / production 等）动态生成配置
 * - mode 来自命令行，例如：vite --mode development
 */
export default defineConfig(({ mode }) => {
    /**
     * 手动加载环境变量
     * 注意：
     * - Vite 不会自动把 .env 文件注入到 process.env
     * - 如果配置本身需要依赖环境变量（如 proxy、端口、插件开关），必须手动调用 loadEnv
     *
     * 参数说明：
     * - mode：当前环境模式
     * - process.cwd()：以项目根目录为基准
     * - ''：加载所有环境变量（不加 VITE_ 前缀过滤）
     */
    const env = loadEnv(mode, process.cwd(), '');

    return {
        /**
         * 插件配置
         */
        plugins: [
            // React 支持插件（开发时自动启用 HMR）
            react(),

            // Mock 服务插件
            viteMockServe({
                mockPath: './_mock', // mock 文件所在目录（相对项目根目录）
                enable: true, // 是否启用 mock（一般可改为 env.VITE_USE_MOCK === 'true'）
            }),
        ],

        /**
         * 开发服务器配置（vite / vite dev）
         */
        server: {
            proxy: {
                /**
                 * 接口代理配置
                 * 所有以 /api 开头的请求都会被代理到目标服务器
                 * 例如：
                 * /api/user  →  http://xxx/user
                 */
                '/api': {
                    target: env.VITE_API_TARGET, // 代理目标地址（来自 .env）
                    changeOrigin: true, // 修改请求头中的 origin，避免跨域问题

                    // 可选：路径重写
                    // rewrite: p => p.replace(/^\/api/, ''),
                    // 如果后端接口本身不带 /api，可取消注释
                },
            },
        },

        /**
         * 预览服务器配置（vite preview）
         * 用于在本地预览 build 后的产物
         */
        preview: {
            port: 8080, // 预览端口（默认 4173）
            host: true, // 监听所有网卡，局域网内可访问
            open: true, // 启动后自动打开浏览器
            strictPort: true, // 端口被占用时直接报错，不自动切换端口
            cors: true, // 开启 CORS
        },

        /**
         * 构建配置（vite build）
         */
        build: {
            /**
             * Rolldown 配置
             * Vite 新版本使用 Rolldown 作为打包器（类似 Rollup）
             */
            rolldownOptions: {
                output: {
                    // 入口文件输出路径与命名
                    entryFileNames: 'js/[name]-[hash].js',

                    // 代码分割产生的 chunk 文件
                    chunkFileNames: 'js/[name]-[hash].js',

                    /**
                     * 静态资源输出规则
                     * 使用函数形式，可按资源类型分类输出
                     */
                    assetFileNames(assetInfo) {
                        // 兼容不同 Rolldown / Rollup 版本
                        const name = assetInfo.names?.[0] ?? assetInfo.name ?? '';

                        // CSS 文件输出到 css 目录
                        if (name.endsWith('.css')) {
                            return 'css/[name]-[hash][extname]';
                        }

                        // 图片资源输出到 img 目录
                        const imgExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp'];
                        if (imgExts.some(ext => name.endsWith(ext))) {
                            return 'img/[name]-[hash][extname]';
                        }

                        // 其他资源统一输出到 asset 目录
                        return 'asset/[name]-[hash][extname]';
                    },
                },
            },
        },
    };
});
