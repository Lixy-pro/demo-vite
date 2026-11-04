/**
 * 用户信息模块（Redux Slice）
 *
 * 职责：
 * - 管理当前登录用户的基础信息
 * - 提供统一的登录 / 退出 action
 *
 * 设计说明：
 * - 登录态以 username 是否存在为核心判断依据
 * - nickname 仅用于展示，不参与权限判断
 * - 所有用户信息更新都通过该 slice，禁止组件直接修改
 */

// Redux Toolkit：用于创建 slice
import { createSlice } from '@reduxjs/toolkit';

// TS 类型：用于约束 action.payload
import type { PayloadAction } from '@reduxjs/toolkit';

/**
 * 用户状态类型
 *
 * @property username - 用户名（空字符串表示未登录）
 * @property nickname - 用户昵称（空字符串表示未设置）
 */
export type UserStateType = {
    username: string;
    nickname: string;
};

/**
 * 用户模块的初始状态
 *
 * 说明：
 * - 使用空字符串而非 null / undefined
 * - 方便组件直接渲染，无需额外判空
 */
const INIT_STATE: UserStateType = {
    username: '',
    nickname: '',
};

/**
 * 用户 slice
 *
 * name: 'user'
 * - 对应 Redux store 中的 state.user
 */
export const userSlice = createSlice({
    name: 'user',

    // 初始状态
    initialState: INIT_STATE,

    // 同步 reducer（action）
    reducers: {
        /**
         * 登录 reducer
         *
         * 触发时机：
         * - 登录成功
         * - 获取用户信息成功
         *
         * 说明：
         * - 直接返回 payload，整体替换用户状态
         * - 使用 _state 表示“不依赖旧状态”，仅为占位参数
         */
        loginReducer: (_state: UserStateType, action: PayloadAction<UserStateType>) => {
            return action.payload;
        },

        /**
         * 退出登录 reducer
         *
         * 行为：
         * - 将用户状态重置为初始状态
         *
         * 注意：
         * - 这里不负责清除 Token
         * - Token 属于浏览器层职责，由组件层处理
         */
        logoutReducer: () => INIT_STATE,
    },
});

/**
 * 导出 actions
 * - 供组件通过 dispatch 调用
 */
export const { loginReducer, logoutReducer } = userSlice.actions;

/**
 * 导出 reducer
 * - 用于 combineReducers 注册到 store
 */
export default userSlice.reducer;
