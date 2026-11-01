/**
 * 用户信息组件
 * 负责展示当前用户的登录状态：
 * - 已登录：展示用户昵称 + 退出按钮
 * - 未登录：展示登录入口链接
 *
 * 行为说明：
 * - 组件挂载或从其他页面返回时，依据 Token 是否存在拉取用户信息
 * - Token 变化时重新拉取（依赖 useEffect 的 token 依赖）
 * - 退出登录时清理 Token 并跳转到登录页
 */
import type { FC } from 'react';
import { useEffect, useState } from 'react';

// 路由相关：跳转与登录页路径
import { Link, useNavigate } from 'react-router-dom';

// 路由常量：登录页路径
import { LOGIN_PATHNAME } from '../router';

// Ant Design 组件
import { Button, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';

// 用户服务：获取用户信息
import { getUserInfoService } from '../services/user';

// Token 工具：读取与清除登录凭证
import { getToken, removeToken } from '../utils/user-token';

/**
 * 用户信息组件
 * @component
 */
const UserInfo: FC = () => {
    // 路由跳转实例
    const nav = useNavigate();

    // 用户名与昵称（用于页面展示）
    const [username, setUsername] = useState('');
    const [nickname, setNickname] = useState('');

    // 当前登录 Token
    // 用于判断登录态，并作为 useEffect 的依赖触发重新拉取
    const token = getToken();

    /**
     * 组件挂载 / Token 变化时，拉取用户信息
     * 说明：
     * - token 存在时发起请求
     * - token 为空时，value 可能为 null，需做兜底处理
     * - 依赖 token 可确保在登录、退出后正确刷新用户状态
     */
    useEffect(() => {
        getUserInfoService().then(value => {
            const { username, nickname } = value || {};
            setUsername(username || '');
            setNickname(nickname || '');
        });
    }, [token]);

    /**
     * 退出登录
     * - 清除本地 Token
     * - 提示退出成功
     * - 跳转至登录页
     */
    function logout() {
        removeToken();
        message.success('退出成功');
        nav(LOGIN_PATHNAME);
    }

    /**
     * 已登录态展示内容
     * 包含用户图标、昵称与退出按钮
     */
    const loggedInView = (
        <>
            <span style={{ color: '#e8e8e8' }}>
                <UserOutlined />
                {nickname}
            </span>
            <Button type="link" onClick={logout}>
                退出
            </Button>
        </>
    );

    /**
     * 未登录态展示内容
     * 提供登录入口链接
     */
    const loginView = <Link to={LOGIN_PATHNAME}>登录</Link>;

    // 根据 username 是否存在，渲染不同状态
    return <div>{username ? loggedInView : loginView}</div>;
};

export default UserInfo;
