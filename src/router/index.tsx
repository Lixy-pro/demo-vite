/**
 * 路由配置模块
 *
 * 职责：
 * - 定义应用的整体路由结构
 * - 配置页面与布局组件之间的嵌套关系
 * - 对外提供统一的路由路径常量与辅助判断方法
 *
 * 设计说明：
 * - 使用 react-router v6 的 createBrowserRouter
 * - 通过 Layout + children 实现“公共布局 + 子页面”
 * - 路由路径统一集中管理，避免魔法字符串散落在业务代码中
 */

import { createBrowserRouter } from 'react-router-dom';

/* ---------------- 布局组件 ---------------- */
// 主布局：包含顶部导航、底部信息，用于绝大多数页面
import MainLayout from '../layouts/MainLayout';

// 管理后台布局：问卷管理相关页面
import ManageLayout from '../layouts/ManageLayout';

// 问卷详情布局：编辑 / 统计页面
import QuestionLayout from '../layouts/QuestionLayout';

/* ---------------- 页面组件 ---------------- */
// 公开页面
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import NotFound from '../pages/NotFound';

// 管理后台页面
import List from '../pages/manage/List';
import Trash from '../pages/manage/Trash';
import Star from '../pages/manage/Star';

// 问卷相关页面
import Edit from '../pages/question/Edit';
import Stat from '../pages/question/Stat';

/**
 * 创建浏览器路由实例
 *
 * 路由结构说明：
 *
 * 1) `/`
 *    - 使用 MainLayout 作为公共布局
 *    - 包含首页、登录、注册、管理后台、404
 *
 * 2) `/question`
 *    - 使用 QuestionLayout 作为独立布局
 *    - 与 MainLayout 解耦，适合沉浸式编辑 / 统计页面
 */
const router = createBrowserRouter([
    {
        // 根路径
        path: '/',

        // 主布局
        element: <MainLayout />,

        // 子路由：渲染在 MainLayout 的 <Outlet /> 中
        children: [
            {
                // 首页
                path: '/',
                element: <Home />,
            },
            {
                // 登录页
                path: 'login',
                element: <Login />,
            },
            {
                // 注册页
                path: 'register',
                element: <Register />,
            },
            {
                // 管理后台
                path: 'manage',

                // 管理布局
                element: <ManageLayout />,

                // 管理子页面
                children: [
                    {
                        path: 'list', // /manage/list
                        element: <List />,
                    },
                    {
                        path: 'star', // /manage/star
                        element: <Star />,
                    },
                    {
                        path: 'trash', // /manage/trash
                        element: <Trash />,
                    },
                ],
            },
            {
                // 404：兜底路由
                path: '*',
                element: <NotFound />,
            },
        ],
    },
    {
        // 问卷详情路径（独立于 MainLayout）
        path: '/question',

        // 问卷布局
        element: <QuestionLayout />,

        children: [
            {
                // 问卷编辑页：/question/edit/:id
                path: 'edit/:id',
                element: <Edit />,
            },
            {
                // 问卷统计页：/question/stat/:id
                path: 'stat/:id',
                element: <Stat />,
            },
        ],
    },
]);

export default router;

/* ---------------- 路由路径常量 ---------------- */
/**
 * 统一定义路由路径
 * - 避免在业务代码中硬编码字符串
 * - 便于后期统一修改
 */
export const HOME_PATHNAME = '/';
export const LOGIN_PATHNAME = '/login';
export const REGISTER_PATHNAME = '/register';

// 管理后台默认首页
export const MANAGE_INDEX_PATHNAME = '/manage/list';

/**
 * 判断当前路径是否为“登录 / 注册”页面
 *
 * 使用场景：
 * - 控制用户数据是否自动加载
 * - 控制登录态相关 UI 展示
 *
 * @param pathname 当前路由路径
 * @returns boolean
 */
export const isLoginOrRegister = (pathname: string) => {
    return [LOGIN_PATHNAME, REGISTER_PATHNAME].includes(pathname);
};

/**
 * 判断当前路径是否为「无需登录即可访问」的公开页面
 *
 * 语义说明：
 * - 返回 true  → 该页面允许游客访问，未登录也不应被重定向到登录页
 * - 返回 false → 该页面需要登录态，未登录用户应被拦截
 *
 * 适用页面：
 * - 首页（HOME_PATHNAME）
 * - 登录页（LOGIN_PATHNAME）
 * - 注册页（REGISTER_PATHNAME）
 *
 * 使用场景：
 * - useNavPage：未登录时决定是否放行当前页面
 * - 与「是否需要加载用户信息」的白名单保持一致
 *
 * 注意：
 * - 这里的判断只看路径，不看 Token
 * - 是否需要「请求用户信息」由 useLoadUserData 结合 Token 决定
 *   两者语义相近但职责不同，不要混用
 *
 * @param pathname 当前路由路径
 * @returns boolean 是否为公开页面
 */
export const isNotNeedUserInfo = (pathname: string) => {
    return [HOME_PATHNAME, LOGIN_PATHNAME, REGISTER_PATHNAME].includes(pathname);
};
