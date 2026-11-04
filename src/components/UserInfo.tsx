// 关闭 ahooks/React 的 exhaustive-deps 检查
// 说明：该组件的渲染逻辑是“按状态切换视图”，
// 刻意不把所有变量都放进依赖数组，属于有意为之
/* eslint-disable react-hooks/exhaustive-deps */

/**
 * 用户信息展示组件
 *
 * 职责：
 * - 根据“是否存在登录态”展示不同 UI：
 *   1) 已登录：展示用户昵称 + 退出按钮
 *   2) 未登录：展示登录入口
 *   3) 有 Token 但用户信息尚未加载：展示加载中
 *
 * 设计要点：
 * - Token 只用于“判断是否需要请求/是否处于登录流程中”
 * - 真正的登录态以 Redux 中的 username / nickname 为准
 * - 视图节点使用 useMemo 缓存，避免无意义重建
 */

import type { FC } from 'react';

// React：仅使用 useMemo 做视图缓存
import { useMemo } from 'react';

// 路由：页面跳转与链接
import { Link, useNavigate } from 'react-router-dom';

// 路由常量
import { LOGIN_PATHNAME } from '../router';

// Ant Design：按钮与消息提示
import { Button, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';

// Redux：派发退出登录 action
import { useDispatch } from 'react-redux';

// Token 工具：读取 / 清除登录凭证
import { getToken, removeToken } from '../utils/user-token';

// 自定义 Hook：获取当前用户信息（来自 Redux）
import useGetUserInfo from '../hooks/useGetUserInfo';
import { logoutReducer } from '../store/userReducer';

/**
 * 用户信息组件
 */
const UserInfo: FC = () => {
    // 路由跳转实例
    const nav = useNavigate();

    // Redux dispatch
    const dispatch = useDispatch();

    /**
     * 当前浏览器中的登录凭证（Token）
     * 注意：
     * - Token 存在 ≠ 用户信息一定已加载
     * - 它只代表“曾经登录过 / 正在尝试登录”
     */
    const token = getToken();

    /**
     * 从 Redux 中获取当前登录用户信息
     * - username：判断是否已登录的核心依据
     * - nickname：用于界面展示
     */
    const { username, nickname } = useGetUserInfo();

    /**
     * 退出登录逻辑
     *
     * 执行顺序非常重要：
     * 1) 清空 Redux 中的用户信息（避免界面短暂展示旧数据）
     * 2) 清除本地 Token
     * 3) 提示用户
     * 4) 跳转到登录页
     */
    const logout = () => {
        // 1）清空全局用户状态
        dispatch(logoutReducer());

        // 2）清除本地登录凭证
        removeToken();

        // 3）用户提示
        message.success('退出成功');

        // 4）跳转登录页
        nav(LOGIN_PATHNAME);
    };

    /**
     * 已登录视图
     * - 展示用户昵称
     * - 提供退出按钮
     *
     * 缓存策略：
     * - 仅在 nickname 变化时重新生成
     * - logout 函数引用稳定（组件级定义），无需作为依赖
     */
    const loggedInView = useMemo(
        () => (
            <>
                <span style={{ color: '#e8e8e8' }}>
                    <UserOutlined />
                    {nickname}
                </span>
                <Button type="link" onClick={logout}>
                    退出
                </Button>
            </>
        ),
        [nickname]
    );

    /**
     * 未登录视图
     * - 只提供一个登录入口
     *
     * 缓存策略：
     * - 无任何依赖，组件生命周期内只创建一次
     */
    const loginView = useMemo(() => <Link to={LOGIN_PATHNAME}>登录</Link>, []);

    /**
     * 加载中视图
     * - 当 Token 存在但用户信息尚未加载完成时使用
     * - 防止 UI 在“登录 → 未登录”之间闪烁
     */
    const loadingView = useMemo(() => <span style={{ color: '#e8e8e8' }}>加载中...</span>, []);

    /**
     * 渲染策略（核心逻辑）
     *
     * 优先级：
     * 1) 有 Token 但 username 为空 → 仍处于“加载用户信息阶段”
     * 2) username 存在 → 已登录
     * 3) 其他情况 → 未登录
     */
    if (token && !username) {
        // 已持有 Token，但用户信息尚未写入 Redux
        return <div>{loadingView}</div>;
    }

    // 根据 username 判断最终展示的登录 / 未登录视图
    return <div>{username ? loggedInView : loginView}</div>;
};

export default UserInfo;
