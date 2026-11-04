/**
 * 应用入口文件
 *
 * 职责：
 * - 创建 React 根节点（Root）
 * - 挂载全局 Provider（Redux）
 * - 渲染应用根组件 <App />
 *
 * 设计说明：
 * - 使用 React 18 的 createRoot API
 * - 开启 StrictMode，用于开发阶段发现潜在问题
 * - Redux store 在应用最外层注入，保证全局可访问
 */

// React：严格模式（仅开发环境生效）
import { StrictMode } from 'react';

// React 18：创建根节点
import { createRoot } from 'react-dom/client';

// 根组件
import App from './App.tsx';

// Redux：将 store 注入 React 组件树
import { Provider } from 'react-redux';

// 全局 Redux store
import store from './store';

// 全局样式（当前暂时注释，按需启用）
// import './index.css';

/**
 * 获取根 DOM 节点并渲染 React 应用
 *
 * 说明：
 * - document.getElementById('root')!
 *   - 使用非空断言（!）告诉 TS：该节点一定存在
 *   - 前提：index.html 中存在 <div id="root"></div>
 */
createRoot(document.getElementById('root')!).render(
    /**
     * StrictMode：
     * - 仅在开发环境下生效
     * - 帮助发现：
     *   - 不安全的生命周期
     *   - 意外的副作用
     *   - 过时 API 使用
     */
    <StrictMode>
        {/**
         * Provider：
         * - 将 Redux store 注入整棵组件树
         * - 任何子组件均可通过 useSelector / useDispatch 访问状态
         */}
        <Provider store={store}>
            <App />
        </Provider>
    </StrictMode>
);
