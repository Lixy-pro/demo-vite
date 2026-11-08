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
 * - 本 Hook 不关心当前在哪个页面
 * - 「哪些页面需要登录」由 useNavPage + isNotNeedUserInfo 负责
 * - 职责分离：这里只管「要不要请求」，不管「要不要跳转」
 *
 * ── 关于初始状态（重要）──
 * - waitingUserData 初始为 true，即「先假定还在加载」
 * - 这是本 Hook 与常见写法最大的不同：
 *   首屏渲染、effect 还没跑的那一帧，消费方就已经处于 loading 态
 * - 目的是避免「已登录用户刷新页面时，先闪一帧未登录 UI」
 * - 代价是：无论有没有 Token，都会先经历一次 loading → false 的切换
 */
function useLoadUserData() {
    const dispatch = useDispatch();

    /**
     * 订阅 pathname 的变化
     *
     * 注意：
     * - 判断条件里并没有直接读取 pathname
     * - 保留它是为了让「路由切换」也触发一次 effect 重新执行，
     *   覆盖「登录页完成登录 → Token 写入 → 需要立刻拉用户数据」这类时序
     * - 属于有意为之，不是多余代码
     */
    const { pathname } = useLocation();

    /**
     * 用户信息「是否就绪」状态
     *
     * 取值语义（注意：它表达的是「还没确定完」而不是「正在请求中」）：
     * - true ：尚未确定用户态。包含两种情况：
     *          a) 请求正在进行中
     *          b) 压根不发请求（已登录 / 游客），但 effect 还没处理完
     * - false：用户态已确定，可以安全渲染页面
     *
     * 状态流转：
     * - 初值 true
     * - 不走请求的分支 → queueMicrotask 里置 false
     * - 走请求的分支   → onFinally 里置 false
     *
     * 消费方：
     * - MainLayout / QuestionLayout：显示 Spin 还是渲染 <Outlet />
     * - useNavPage：用户态是否已确定，能否做跳转判断
     *
     * 注意：
     * - 本版没有 onBefore，loading 的「开启」完全靠初值 true 承担
     * - 请求失败时同样在 onFinally 变回 false，此时 username 仍为空，
     *   界面按「未登录」渲染，是否提示错误由业务层决定
     */
    // const [waitingUserData, setWaitingUserData] = useState(() => !!getToken());
    const [waitingUserData, setWaitingUserData] = useState(true);

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
     * - 这里必须由 useEffect 按条件决定是否触发，所以关闭自动执行
     *
     * 本版只用到 onSuccess / onFinally 两个回调：
     * - 没有 onBefore：loading 的开启由初值 true 负责
     * - 没有 onError  ：失败与成功共用 onFinally 收尾
     *
     * 泛型说明：
     * - ResDataType | null：接口返回的数据类型
     * - []                ：run 的参数列表为空，即 run() 不传参
     */
    const { run } = useRequest<ResDataType | null, []>(getUserInfoService, {
        manual: true,

        /**
         * 请求成功
         * - 把后端返回的用户信息整体写入 Redux
         * - 写入后 username 有值，effect 下次执行会命中第一个分支，
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
         * - 置 false，通知布局层与 useNavPage「用户态已确定」
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
     * 判断结构（两条「不用请求」的路径合并为一个分支）：
     * 1) 已有用户数据  ┐
     * 2) 本地没有 Token ├→ 都不发请求，统一在微任务里收尾为 false
     *                  ┘
     * 3) 走到最后      → 有 Token 且没有用户数据，发起请求
     *
     * 典型场景对照：
     * - 游客打开首页            → 无 Token，命中分支 1，不请求
     * - 已登录用户刷新后台页面  → 有 Token + Redux 为空 → 走分支 3 请求（关键场景）
     * - 请求完成后任意重渲染    → username 已有值，命中分支 1，不请求
     *
     * ── 为什么用 queueMicrotask 收尾 ──
     * effect 里同步调用 setState，React 会在渲染阶段给出
     * 「Cannot update a component while rendering a different component」告警。
     * 用 queueMicrotask 把置 false 推迟到当前同步流程结束之后，
     * 让这次状态更新走正常的调度流程，避免告警和额外的渲染嵌套。
     *
     * ── 一个必须知道的副作用 ──
     * 游客（无 Token）首屏也会经历 true → false 的一次切换，
     * 也就是说「未登录用户也会看到一瞬间的 loading」。
     * 如果希望游客完全不 loading，需要区分「不发请求」和「正在请求」两种状态，
     * 例如单独用一个 init 标记，或把初值改成 getToken() 的存在性判断。
     *
     * 依赖说明：
     * - username：用户态变化需要重新判断
     * - pathname：路由变化需要重新判断（覆盖登录后的时序问题）
     * - run     ：ahooks 保证引用稳定，放进依赖无害
     */
    useEffect(() => {
        // 1) & 2) 已登录（用户态已写入 Redux）或 无 Token（游客）→ 都不发请求
        if (username || !getToken()) {
            queueMicrotask(() => {
                setWaitingUserData(false);
            });
            return;
        }

        // 3) 有 Token 但没有用户数据 → 补一次用户信息
        //    收尾由 onFinally 负责，这里不手动置 false
        run();
    }, [username, pathname, run]);

    /**
     * 对外只暴露 waitingUserData
     * - 刻意不暴露 run / username
     * - 调用方只关心「用户数据是否还在确认中」，避免外部绕过规则手动触发请求
     */
    return { waitingUserData };
}

export default useLoadUserData;
