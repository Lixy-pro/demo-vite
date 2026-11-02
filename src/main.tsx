/**
 * 应用入口文件
 * 创建 React 根节点并渲染应用，启用严格模式
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// import './index.css';
import App from './App.tsx';
import { Provider } from 'react-redux';
import store from './study-myself/redux/store/index';

// 获取根 DOM 节点并渲染 React 应用
createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Provider store={store}>
            <App />
        </Provider>
    </StrictMode>
);
