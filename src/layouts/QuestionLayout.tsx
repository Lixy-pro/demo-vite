/**
 * 问卷详情布局组件（QuestionLayout）
 *
 * 职责：
 * - 作为“问卷编辑页”和“问卷统计页”的公共布局容器
 * - 在问卷相关子路由渲染前，确保当前用户身份已经确定
 *
 * 设计说明：
 * - 不关心具体是“编辑”还是“统计”，只负责公共逻辑
 * - 用户数据加载逻辑复用 useLoadUserData
 * - 用户信息未加载完成时，展示全局 Spin，避免子页面渲染错误的登录态 UI
 *
 * 路由关系：
 * - Edit 页面
 * - Stat 页面
 * 均为当前布局的子路由，通过 <Outlet /> 渲染
 */

import type { FC } from 'react';

// 路由：子路由出口
import { Outlet } from 'react-router-dom';

// Ant Design：加载中组件
import { Spin } from 'antd';

// 自定义 Hook：负责在合适时机加载用户信息
import useLoadUserData from '../hooks/useLoadUserData';

import useNavPage from '../hooks/useNavPage';

/**
 * 问卷详情布局组件
 */
const QuestionLayout: FC = () => {
    /**
     * 用户数据加载状态
     * - waitingUserData = true  → 正在获取用户信息
     * - waitingUserData = false → 用户态已确定，可渲染子页面
     */
    const { waitingUserData } = useLoadUserData();

    // 页面导航控制
    useNavPage(waitingUserData);

    return (
        <>
            {/**
             * 布局标识（开发 / 调试用）
             * - 用于快速确认当前命中的是问卷详情布局
             * - 后续可替换为真正的页面头部或导航
             */}
            <p>Question layout</p>

            <div>
                {/**
                 * 子路由渲染区
                 *
                 * 渲染策略：
                 * - 用户信息加载中：展示 Spin，阻塞子页面渲染
                 * - 加载完成：渲染 Edit / Stat 页面
                 *
                 * 这样做的目的：
                 * - 避免子页面在登录态未确定前访问用户信息
                 * - 防止出现“先显示未登录，再变已登录”的闪烁问题
                 */}
                {waitingUserData ? (
                    <div style={{ textAlign: 'center', marginTop: '60px' }}>
                        <Spin size="large" />
                    </div>
                ) : (
                    <Outlet />
                )}
            </div>
        </>
    );
};

export default QuestionLayout;
