/**
 * 自定义 Hook：登录态驱动的页面导航控制（路由守卫）
 *
 * 职责：
 * - 根据「用户数据是否加载完成」+「是否已登录」+「当前路径」
 *   决定是否需要自动跳转页面
 *
 * 核心规则：
 * 1) 用户信息仍在加载 → 不做任何跳转（避免误判）
 * 2) 已登录：
 *    - 若在登录 / 注册页 → 跳转到管理后台首页
 *    - 其他页面 → 正常停留
 * 3) 未登录：
 *    - 若在公开页面（无需登录） → 正常停留
 *    - 其他页面 → 跳转到登录页
 *
 * 设计说明：
 * - 这是一个「副作用型」Hook，只负责跳转，不渲染 UI
 * - 跳转逻辑集中在此处，避免散落在各个页面中
 * - 依赖 waitingUserData，确保用户态确定后再决策
 */

// 关闭 exhaustive-deps 检查：
// nav（useNavigate 返回值）引用稳定，无需纳入依赖，属于有意为之
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// 获取当前登录用户信息
import useGetUserInfo from './useGetUserInfo';

// 路由判断工具与路径常量
import {
    isLoginOrRegister,
    isNotNeedUserInfo,
    LOGIN_PATHNAME,
    MANAGE_INDEX_PATHNAME,
} from '../router';

/**
 * 页面导航控制 Hook
 *
 * @param waitingUserData - 是否正在加载用户信息
 *   - true  ：用户态未确定，暂不跳转
 *   - false ：用户态已确定，执行导航判断
 */
function useNavPage(waitingUserData: boolean) {
    // 当前登录用户名（存在即视为已登录）
    const { username } = useGetUserInfo();

    // 当前路由路径
    const { pathname } = useLocation();

    // 路由跳转实例
    const nav = useNavigate();

    /**
     * 导航决策逻辑
     *
     * 执行时机：
     * - 用户数据加载状态变化
     * - 登录态变化
     * - 路由路径变化
     */
    useEffect(() => {
        // 用户信息尚未加载完成 → 不做任何判断，避免错误跳转
        if (waitingUserData) return;

        /* ---------- 已登录分支 ---------- */
        if (username) {
            // 已登录却停留在登录 / 注册页 → 跳转到管理后台
            if (isLoginOrRegister(pathname)) {
                nav(MANAGE_INDEX_PATHNAME);
            }
            // 其他页面 → 允许访问，直接结束
            return;
        }

        /* ---------- 未登录分支 ---------- */
        // 当前页面无需登录即可访问 → 放行
        if (isNotNeedUserInfo(pathname)) return;

        // 其余需要登录的页面 → 重定向到登录页
        nav(LOGIN_PATHNAME);
    }, [waitingUserData, username]);
}

export default useNavPage;
