/**
 * 主布局组件
 * 包含顶部导航栏（Logo + 用户信息）、中间内容区（子路由出口）、底部版权信息
 */
import type { FC } from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import styles from './MainLayout.module.scss';
import Logo from '../components/Logo';
import UserInfo from '../components/UserInfo';

const { Header, Footer, Content } = Layout;

const MainLayout: FC = () => {
    return (
        <Layout>
            {/* 顶部导航栏：左侧 Logo，右侧用户信息 */}
            <Header className={styles.header}>
                <div className={styles.left}>
                    <Logo />
                </div>
                <div className={styles.right}>
                    <UserInfo />
                </div>
            </Header>
            {/* 中间内容区：渲染子路由组件 */}
            <Content className={styles.main} style={{ padding: 0 }}>
                <Outlet />
            </Content>
            {/* 底部版权信息 */}
            <Footer className={styles.footer}>
                小慕问卷 &copy;2026 - present. Created by 李老师
            </Footer>
        </Layout>
    );
};

export default MainLayout;
