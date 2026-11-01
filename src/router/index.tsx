/**
 * 路由配置模块
 * 定义应用的路由结构和路径常量
 */
import { createBrowserRouter } from 'react-router-dom';

import MainLayout from '../layouts/MainLayout';
import ManageLayout from '../layouts/ManageLayout';
import QuestionLayout from '../layouts/QuestionLayout';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import NotFound from '../pages/NotFound';
import List from '../pages/manage/List';
import Trash from '../pages/manage/Trash';
import Star from '../pages/manage/Star';
import Edit from '../pages/question/Edit';
import Stat from '../pages/question/Stat';

// 创建浏览器路由实例
const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        children: [
            {
                path: '/',
                element: <Home />,
            },
            {
                path: 'login',
                element: <Login />,
            },
            {
                path: 'register',
                element: <Register />,
            },
            {
                path: 'manage',
                element: <ManageLayout />,
                children: [
                    {
                        path: 'list',
                        element: <List />,
                    },
                    {
                        path: 'star',
                        element: <Star />,
                    },
                    {
                        path: 'trash',
                        element: <Trash />,
                    },
                ],
            },
            {
                path: '*',
                element: <NotFound />,
            },
        ],
    },
    {
        path: '/question',
        element: <QuestionLayout />,
        children: [
            {
                path: 'edit/:id',
                element: <Edit />,
            },
            {
                path: 'stat/:id',
                element: <Stat />,
            },
        ],
    },
]);

export default router;

// --------- 分割线 ---------
// 路由路径常量定义
export const HOME_PATHNAME = '/';
export const LOGIN_PATHNAME = '/login';
export const REGISTER_PATHNAME = '/register';
export const MANAGE_INDEX_PATHNAME = '/manage/list';
