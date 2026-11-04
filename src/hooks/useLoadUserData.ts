import { useEffect, useState } from 'react';
import { useRequest } from 'ahooks';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';

// 引入 Token 读取方法
// 用于在白名单页面中区分：
// - 纯游客访问（无 Token） → 不请求用户信息
// - 已登录用户刷新 / 直接进入（有 Token） → 仍然需要请求用户信息
import { getToken } from '../utils/user-token';

import type { ResDataType } from '../services/ajax';
import { getUserInfoService } from '../services/user';
import { loginReducer } from '../store/userReducer';

import { HOME_PATHNAME, LOGIN_PATHNAME, REGISTER_PATHNAME } from '../router';
import useGetUserInfo from './useGetUserInfo';

/**
 * 自定义 Hook：全局用户数据加载与状态管理
 *
 * 核心职责：
 * - 在未登录时，于合适的时机自动请求用户信息
 * - 已登录时，避免重复请求
 * - 在公开页面中，区分“游客”和“已登录用户”，避免无意义请求
 *
 * 关键设计：
 * - 登录态以 Redux 中的 username 为准
 * - Token 只用于“是否需要尝试请求”的辅助判断
 * - waitingUserData 仅表示“当前是否正在请求用户信息”
 */
function useLoadUserData() {
    const dispatch = useDispatch();
    const { pathname } = useLocation();

    /**
     * 用户信息请求状态
     * - true  ：正在请求用户信息
     * - false ：未请求 / 请求完成（成功或失败）
     */
    const [waitingUserData, setWaitingUserData] = useState(false);

    /**
     * 无需“主动请求”用户信息的页面白名单
     *
     * 说明：
     * - 首页 / 登录页 / 注册页通常是公开页面
     * - 但若用户已持有 Token（例如刷新页面），仍需请求用户信息
     */
    const noLoadUserDataList: string[] = [HOME_PATHNAME, LOGIN_PATHNAME, REGISTER_PATHNAME];

    /**
     * 当前登录用户 username
     * - 存在：说明用户态已写入 Redux，无需再次请求
     */
    const { username } = useGetUserInfo();

    /**
     * 用户信息请求（手动触发）
     *
     * 说明：
     * - manual: true → 不自动请求，由 useEffect 控制调用
     */
    const { run } = useRequest<ResDataType | null, []>(getUserInfoService, {
        manual: true,

        // 请求开始前：标记 loading
        onBefore() {
            setWaitingUserData(true);
        },

        // 请求成功：写入 Redux，完成登录态初始化
        onSuccess(result) {
            const { username, nickname } = result;
            dispatch(loginReducer({ username, nickname }));
        },

        // 请求结束（成功 / 失败）：关闭 loading
        onFinally() {
            setWaitingUserData(false);
        },
    });

    /**
     * 控制用户信息请求的触发时机
     *
     * 规则说明：
     * 1) 已登录（username 存在） → 不再请求
     * 2) 处于白名单页面：
     *    - 无 Token → 视为游客，不请求
     *    - 有 Token → 仍尝试请求（用于刷新 / 直接进入场景）
     * 3) 其他页面 → 一律请求用户信息
     */
    useEffect(() => {
        // 已登录，无需重复请求
        if (username) return;

        // 白名单页面 + 无 Token → 不请求
        if (noLoadUserDataList.includes(pathname) && !getToken()) return;

        // 触发用户信息请求
        run();
    }, [username, pathname, run]);

    /**
     * 对外暴露：
     * - waitingUserData：是否正在加载用户信息
     */
    return { waitingUserData };
}

export default useLoadUserData;
