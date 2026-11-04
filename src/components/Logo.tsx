/**
 * Logo 组件
 *
 * 职责：
 * - 展示应用图标与应用名称
 * - 根据当前登录状态，决定点击 Logo 后的跳转目标：
 *   1) 未登录：跳转首页（HOME_PATHNAME）
 *   2) 已登录：跳转管理后台首页（MANAGE_INDEX_PATHNAME）
 *
 * 设计说明：
 * - 登录状态以 Redux 中的 username 为准
 * - 使用本地 state 管理跳转路径，避免直接依赖 username 渲染 Link
 * - 通过 queueMicrotask 延迟更新路径，避免在 effect 中同步触发状态更新
 */

import type { FC } from 'react';
import { useState, useEffect } from 'react';

// Ant Design 组件与图标
import { Space, Typography } from 'antd';
import { FormOutlined } from '@ant-design/icons';

// 路由链接
import { Link } from 'react-router-dom';

// 样式（CSS Modules）
import styles from './Logo.module.scss';

// 自定义 Hook：获取当前登录用户信息
import useGetUserInfo from '../hooks/useGetUserInfo';

// 路由常量
import { HOME_PATHNAME, MANAGE_INDEX_PATHNAME } from '../router';

const { Title } = Typography;

/**
 * Logo 组件
 */
const Logo: FC = () => {
    /**
     * 当前登录用户信息
     * - username 存在即视为已登录
     */
    const { username } = useGetUserInfo();

    /**
     * Logo 点击后的跳转路径
     * - 默认值：首页
     * - 登录成功后切换为管理后台首页
     */
    const [pathname, setPathname] = useState(HOME_PATHNAME);

    /**
     * 登录状态变化时，更新跳转路径
     *
     * 执行时机说明：
     * - 当 username 从无到有时触发
     * - 使用 queueMicrotask 将状态更新推迟到当前调用栈之后
     *
     * 使用 queueMicrotask 的原因：
     * - 避免在 useEffect 中同步调用 setState
     * - 减少 React 在渲染阶段对状态更新的警告或额外调度
     */
    useEffect(() => {
        if (username) {
            queueMicrotask(() => {
                setPathname(MANAGE_INDEX_PATHNAME);
            });
        }
    }, [username]);

    /**
     * Logo UI
     * - 图标 + 应用名称
     * - 点击后跳转到 pathname
     */
    return (
        <div className={styles.container}>
            <Link to={pathname}>
                <Space>
                    {/* 应用图标 */}
                    <Title>
                        <FormOutlined />
                    </Title>

                    {/* 应用名称 */}
                    <Title>小慕问卷</Title>
                </Space>
            </Link>
        </div>
    );
};

export default Logo;
