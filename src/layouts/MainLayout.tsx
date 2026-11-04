/**
 * 主布局组件（MainLayout）
 *
 * 职责：
 * - 作为应用的主框架布局
 * - 统一管理页面结构：
 *   1) 顶部导航栏（Logo + 用户信息）
 *   2) 中间内容区（子路由渲染出口）
 *   3) 底部版权信息
 *
 * 设计说明：
 * - 使用 react-router 的 <Outlet /> 渲染子路由页面
 * - 在用户信息尚未加载完成时，阻止子路由渲染，避免页面闪现未登录态
 * - 用户数据加载逻辑统一收敛到 useLoadUserData 中，布局层只关心“是否加载完成”
 */

import type { FC } from 'react';

// 路由：子路由出口
import { Outlet } from 'react-router-dom';

// Ant Design 布局与加载组件
import { Layout, Spin } from 'antd';

// 样式（CSS Modules）
import styles from './MainLayout.module.scss';

// 业务组件
import Logo from '../components/Logo';
import UserInfo from '../components/UserInfo';

// 自定义 Hook：负责在合适时机加载用户信息
import useLoadUserData from '../hooks/useLoadUserData';

import useNavPage from '../hooks/useNavPage';

const { Header, Footer, Content } = Layout;

/**
 * 主布局组件
 */
const MainLayout: FC = () => {
    /**
     * 用户数据加载状态
     * - waitingUserData = true  → 正在拉取用户信息
     * - waitingUserData = false → 可以安全渲染页面内容
     */
    const { waitingUserData } = useLoadUserData();

    // 页面导航控制
    useNavPage(waitingUserData);

    return (
        <Layout>
            {/**
             * 顶部导航栏
             * 左侧：Logo（根据登录态跳转不同页面）
             * 右侧：用户信息 / 登录入口
             */}
            <Header className={styles.header}>
                <div className={styles.left}>
                    <Logo />
                </div>
                <div className={styles.right}>
                    <UserInfo />
                </div>
            </Header>

            {/**
             * 中间内容区
             *
             * 渲染策略：
             * - 用户信息加载中 → 展示全局 Spin
             * - 加载完成 → 渲染子路由页面 <Outlet />
             *
             * 这样做的目的：
             * - 防止子组件在登录态未确定前渲染错误 UI
             * - 避免“先显示未登录，再变已登录”的闪烁问题
             */}
            <Content className={styles.main} style={{ padding: 0 }}>
                {waitingUserData ? (
                    <div style={{ textAlign: 'center', marginTop: '60px' }}>
                        <Spin size="large" />
                    </div>
                ) : (
                    <Outlet />
                )}
            </Content>

            {/**
             * 底部版权信息
             * - 纯展示，不涉及业务逻辑
             */}
            <Footer className={styles.footer}>
                小慕问卷 &copy;2026 - present. Created by 李老师
            </Footer>
        </Layout>
    );
};

export default MainLayout;
