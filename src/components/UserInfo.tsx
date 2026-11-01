/* eslint-disable react-hooks/exhaustive-deps */
/**
 * 用户信息组件
 * 负责展示当前用户的登录状态：
 * - 已登录：展示用户昵称 + 退出按钮
 * - 未登录：展示登录入口链接
 *
 * 实现说明：
 * - 使用 ahooks 的 useRequest 拉取用户信息，自动管理 loading / error / data
 * - 依据 Token 是否存在决定是否发起请求（ready）
 * - 依据 data 中是否有 username 渲染不同视图
 * - 视图节点使用 useMemo 缓存，避免每次 render 新建对象
 * - 退出登录时清理 Token 并跳转到登录页
 */

// React 相关：hooks
import { useMemo } from 'react';

// 路由相关：跳转与登录页路径
import { Link, useNavigate } from 'react-router-dom';

// 路由常量：登录页路径
import { LOGIN_PATHNAME } from '../router';

// Ant Design 组件与图标
import { Button, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';

// 请求 Hook：自动管理请求状态
import { useRequest } from 'ahooks';

// 用户服务：获取用户信息
import { getUserInfoService } from '../services/user';

// Token 工具：读取与清除登录凭证
import { getToken, removeToken } from '../utils/user-token';

import type { ResDataType } from '../services/ajax';

/**
 * 用户信息组件
 */
const UserInfo = () => {
    // 路由跳转实例
    const nav = useNavigate();

    // 当前登录 Token（用于判断登录态与控制请求是否发起）
    const token = getToken();

    /**
     * 使用 useRequest 拉取用户信息
     *
     * 配置说明：
     * - ready：仅在存在 token 时发起请求，未登录不请求
     * - loading：请求进行中的加载状态
     * - error：请求失败时的错误对象
     * - data：请求成功后的返回数据（ResDataType | null）
     *
     * 依赖说明：
     * - refreshDeps: [token] —— token 变化时自动重新拉取
     *   覆盖：登录成功、退出登录、token 刷新等场景
     */
    const { data, loading, error } = useRequest<ResDataType | null, []>(getUserInfoService, {
        // ready: !!token,
        refreshDeps: [token],
    });

    // 从返回数据中提取用户字段，缺失时兜底为空字符串
    const username = data?.username || '';
    const nickname = data?.nickname || '';

    /**
     * 退出登录
     * - 清除本地 Token
     * - 提示退出成功
     * - 跳转至登录页
     *
     * 注：token 变化后，useRequest 的 ready 变为 false，
     * data 会在下次渲染中被 username 兜底逻辑处理为未登录态
     */
    const logout = () => {
        removeToken();
        message.success('退出成功');
        nav(LOGIN_PATHNAME);
    };

    /**
     * 已登录态视图
     * 包含用户图标、昵称与退出按钮
     *
     * 缓存策略：
     * - 仅在 nickname 变化时重新生成
     * - logout 引用稳定，不触发重算
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
     * 未登录态视图
     * 提供登录入口链接
     *
     * 缓存策略：
     * - 无依赖，组件生命周期内只创建一次
     */
    const loginView = useMemo(() => <Link to={LOGIN_PATHNAME}>登录</Link>, []);

    /**
     * 加载态视图
     * 在用户信息拉取期间展示，避免闪烁"登录"文字
     */
    const loadingView = useMemo(() => <span style={{ color: '#e8e8e8' }}>加载中...</span>, []);

    // 请求失败：视为未登录或登录态失效，展示登录入口
    if (error) {
        return <div>{loginView}</div>;
    }

    // 请求进行中：展示加载态（仅在已登录且尚未拿到数据时）
    if (loading || (token && !username)) {
        return <div>{loadingView}</div>;
    }

    // 依据 username 是否存在，渲染已登录 / 未登录视图
    return <div>{username ? loggedInView : loginView}</div>;
};

export default UserInfo;
