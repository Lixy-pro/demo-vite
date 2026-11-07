import js from '@eslint/js'; // ESLint 官方基础规则集（推荐配置）
import globals from 'globals'; // 各运行环境的全局变量清单（browser / node / es2023…）
import reactHooks from 'eslint-plugin-react-hooks'; // React Hooks 规则（依赖数组、调用位置等）
import reactRefresh from 'eslint-plugin-react-refresh'; // 校验组件写法是否兼容 Vite 的 Fast Refresh
import tseslint from 'typescript-eslint'; // TypeScript 解析与规则（TS 版 ESLint 工具链）
import prettier from 'eslint-config-prettier'; // 关闭与 Prettier 冲突的格式化规则
import { defineConfig, globalIgnores } from 'eslint/config';
// defineConfig：提供配置的类型提示与校验
// globalIgnores：声明全局忽略目录（比在每个对象里写 ignores 更直观）

/**
 * ESLint 扁平配置（Flat Config）
 * 与旧的 .eslintrc 不同，这里导出的是一个【配置对象数组】：
 * - 数组按顺序执行，后面的配置会覆盖/合并前面的同名规则
 * - 每一项可以只针对部分文件（通过 files 限定）
 */
export default defineConfig([
    /**
     * 全局忽略：完全不参与检查的路径
     * - dist：构建产物
     * - 配置文件自身：vite.config.ts 属于 Node 环境，
     *   用浏览器端 tsconfig 做类型检查会误报，交给 tsconfig.node.json 管
     * - _mock：mock 数据文件，通常是简单对象，无需严格检查
     */
    globalIgnores(['dist', 'vite.config.ts', '_mock']),

    /**
     * 主配置块：针对 TS / TSX 源码
     */
    {
        // 只对这些文件生效（glob 模式）
        files: ['**/*.{ts,tsx}'],

        // 继承的预设规则集（按顺序合并，后者优先级更高）
        extends: [
            js.configs.recommended, // 1) JS 基础推荐规则（no-unused-vars 等）
            // ...tseslint.configs.recommendedTypeChecked, // 展开：类型感知版
            tseslint.configs.recommended, // 2) TS 推荐规则，并自动接入 TS 解析器
            reactHooks.configs.flat.recommended, // 3) Hooks 规则（rules-of-hooks / exhaustive-deps）
            reactRefresh.configs.vite, // 4) Vite 场景的 Fast Refresh 兼容规则
        ],

        languageOptions: {
            // 声明可用的全局变量来自浏览器环境
            // 这样使用 window、document、localStorage、setTimeout 等
            // 不会被误报为 "xxx is not defined"
            // 注意：这只是声明全局变量，【不会】引入 Node 的 process 等
            globals: globals.browser,
            parserOptions: {
                // 指向浏览器端 tsconfig，让规则能读取类型信息
                project: './tsconfig.app.json',
                // 以配置文件所在目录为基准解析上面的相对路径
                tsconfigRootDir: import.meta.dirname,
            },

            // 补充：若需更严格控制语法版本，可显式指定
            // ecmaVersion: 2023,
            // sourceType: 'module',
            // parserOptions: { project: './tsconfig.app.json' }  // 开启类型感知规则（见下方说明）
        },
        rules: {
            // 关闭 JS 版的 no-unused-vars：它对 TS 的类型导入、enum 等识别不准
            // 未使用变量的检查交给 TS 的 noUnusedLocals / noUnusedParameters
            // （你 tsconfig.app.json 里已开启）
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    // 以下划线开头的参数/变量视为"有意未使用"，不报错
                    // 例如事件回调里用 (_event) => {} 占位
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],

            // 类型感知规则里较严格、常见需调整的两条
            // 数组/对象下标访问返回 any（TS 的 noUncheckedIndexedAccess 未开时尤其常见）
            // '@typescript-eslint/no-unsafe-member-access': 'warn',
            // '@typescript-eslint/no-unsafe-call': 'warn',
            // '@typescript-eslint/no-unsafe-assignment': 'warn',
            // Promise 未处理（忘了 await 或 .catch）—— 保持 error，这条很值
            // '@typescript-eslint/no-floating-promises': 'error',
        },
    },

    /**
     * 必须放在【最后一项】
     * 作用是关闭所有与代码格式化相关的规则（缩进、引号、分号、换行等），
     * 把这些交给 Prettier 处理，避免 ESLint 和 Prettier 互相"打架"。
     * 因为它要覆盖前面所有配置，所以顺序上必须垫底。
     */
    prettier,
]);
