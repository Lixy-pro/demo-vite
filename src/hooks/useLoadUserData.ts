import { useEffect, useState } from 'react';
import { useRequest } from 'ahooks';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';

/**
 * 读取本地登录凭证（Token）
 *
 * 本文件中的核心作用：
 * - Token 是「是否发起用户信息请求」的唯一前置条件
 * - 无 Token → 一定是游客，请求必然失败，直接跳过
 * - 有 Token → 可能处于「已登录但 Redux 还没数据」的状态（刷新 / 直接输入 URL），
 *   此时必须请求一次，把用户态补回来
 */
import { getToken } from '../utils/user-token';

import type { ResDataType } from '../services/ajax';
import { getUserInfoService } from '../services/user';
import { loginReducer } from '../store/userReducer';

import useGetUserInfo from './useGetUserInfo';

/**
 * 自定义 Hook：全局用户信息加载与状态管理
 *
 * ── 职责 ──
 * - 在「有 Token 但 Redux 中还没有用户数据」时，自动请求一次用户信息
 * - 已有用户数据时，不重复请求
 * - 无 Token 时，不发起无意义请求
 *
 * ── 判断依据的分层 ──
 * - username（Redux）→ 回答「现在知不知道我是谁」
 * - Token（本地）    → 回答「我有没有资格去问我是谁」
 * 两者配合：有资格 + 还不知道 = 该去问了
 *
 * ── 与路由的关系 ──
 * - 本 Hook 不再关心当前在哪个页面
 * - 「哪些页面需要登录」由 useNavPage + isNotNeedUserInfo 负责
 * - 职责分离：这里只管「要不要请求」，不管「要不要跳转」
 */
function useLoadUserData() {
    const dispatch = useDispatch();

    /**
     * 订阅 pathname 的变化
     *
     * 注意：
     * - 当前 effect 的判断条件里并没有用到 pathname
     * - 保留它是为了让「路由切换」也触发一次 effect 重新执行，
     *   覆盖「在登录页完成登录 → Token 写入 → 需要立刻拉用户数据」这类时序
     * - 属于有意为之，不是多余代码
     */
    const { pathname } = useLocation();

    /**
     * 用户信息请求状态
     * - true  ：请求已发出、尚未结束（onBefore → onFinally 之间）
     * - false ：从未请求 / 请求已结束（成功或失败）
     *
     * 消费方：
     * - MainLayout / QuestionLayout 用它决定「显示 Spin 还是渲染 <Outlet />」
     * - useNavPage 用它决定「用户态是否已确定，可以做跳转判断」
     *
     * 注意：
     * - 请求失败时它同样会变回 false
     * - 此时 username 仍为空，界面会按「未登录」渲染，
     *   是否要额外提示错误由业务层决定
     */
    const [waitingUserData, setWaitingUserData] = useState(false);

    /**
     * 从 Redux 读取当前用户
     * - username 存在：用户态已就绪，无需再请求
     * - username 为空：还不知道是谁，可能需要请求
     *
     * 该 Hook 内部已做兜底，state.user 为 undefined 时返回空字符串，
     * 所以这里可以安全解构
     */
    const { username } = useGetUserInfo();

    /**
     * 用户信息请求实例（手动触发）
     *
     * manual: true 的意义：
     * - useRequest 默认在组件挂载时自动执行
     * - 这里必须由 useEffect 按条件决定是否触发，
     *   所以关闭自动执行，只拿到 run 方法
     *
     * 泛型说明：
     * - ResDataType | null：接口返回的数据类型
     * - []                ：run 的参数列表为空，即 run() 不传参
     */
    const { run } = useRequest<ResDataType | null, []>(getUserInfoService, {
        manual: true,

        /**
         * 请求发起前
         * - 立刻置为 true，让布局层先显示 Spin
         * - 避免「已登录用户在刷新时先闪一下未登录 UI」
         */
        onBefore() {
            setWaitingUserData(true);
        },

        /**
         * 请求成功
         * - 把后端返回的用户信息整体写入 Redux
         * - 写入后 username 有值，effect 下次执行会走「已登录，直接 return」分支，
         *   天然形成「只请求一次」的效果
         *
         * 注意：
         * - 这里假设接口成功即代表已登录
         * - 若后端在未登录时返回 200 + 空数据，需要在此加判断，
         *   否则会写入一个空的登录态
         */
        onSuccess(result) {
            const { username, nickname } = result;
            dispatch(loginReducer({ username, nickname }));
        },

        /**
         * 请求结束（成功与失败都会执行）
         * - 关闭 loading，让布局层渲染真实页面
         * - 放在 onFinally 而不是 onSuccess 末尾，
         *   保证接口报错时 Spin 不会一直转下去
         */
        onFinally() {
            setWaitingUserData(false);
        },
    });

    /**
     * 请求触发决策
     *
     * 判断顺序（短路，命中即返回）：
     * 1) 已经有用户数据 → 直接结束，不重复请求
     * 2) 本地没有 Token → 直接结束，游客无需请求
     * 3) 走到这里 = 有 Token 且没有用户数据 → 发起请求
     *
     * 典型场景对照：
     * - 游客打开首页            → 无 Token，第 2 条拦截，不请求
     * - 登录成功跳进后台        → Token 写入 + username 为空 → 请求
     * - 已登录用户刷新后台页面  → 有 Token + Redux 被清空 → 请求（关键场景）
     * - 请求完成后任意重渲染    → username 已有值，第 1 条拦截，不请求
     *
     * 依赖说明：
     * - username：用户态变化需要重新判断
     * - pathname：路由变化需要重新判断（覆盖登录后的时序问题）
     * - run     ：ahooks 保证引用稳定，放进依赖无害
     */
    useEffect(() => {
        // 1) 已登录（用户态已写入 Redux）→ 不再请求
        if (username) return;

        // 2) 无 Token → 游客，请求注定失败，不发起
        if (!getToken()) return;

        // 3) 有 Token 但没有用户数据 → 补一次用户信息
        run();
    }, [username, pathname, run]);

    /**
     * 对外只暴露 loading 状态
     * - 刻意不暴露 run / username
     * - 调用方只关心「用户数据还在加载吗」，避免外部绕过规则手动触发请求
     */
    return { waitingUserData };
}

export default useLoadUserData;
