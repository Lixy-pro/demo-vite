/**
 * Redux Store 配置
 *
 * 职责：
 * - 创建全局唯一的 Redux store
 * - 注册各个业务模块的 reducer
 * - 对外提供全局 State 类型（StateType）
 *
 * 设计说明：
 * - 使用 Redux Toolkit 的 configureStore，内置：
 *   - Redux DevTools
 *   - 默认中间件（如 thunk）
 *   - 更好的开发体验与类型推断
 * - 当前仅包含 user 模块，后续可按业务继续扩展
 */

// Redux Toolkit：用于创建 store
import { configureStore } from '@reduxjs/toolkit';

// 用户模块 reducer
import userReducer from './userReducer';

// 用户模块状态类型
import type { UserStateType } from './userReducer';

import componentsReducer from './componentsReducer';

import type { ComponentsStateType } from './componentsReducer';

/**
 * 全局 Redux State 类型
 *
 * 说明：
 * - 该类型与 store 中注册的 reducer 一一对应
 * - key 必须与 configureStore 中的 reducer 名称保持一致
 *
 * @property user - 用户登录态与用户信息
 */
export type StateType = {
    user: UserStateType;
    components: ComponentsStateType;
    // 其他模块类型在此扩展，例如：
    // question: QuestionStateType;
    // global: GlobalStateType;
};

/**
 * 创建并导出全局 store
 *
 * reducer 映射规则：
 * - 'user' → state.user
 * - 后续新增模块时，在此处注册即可
 */
export default configureStore({
    reducer: {
        // 用户模块：对应 state.user
        user: userReducer,

        // 问卷组件列表：对应 state.components
        components: componentsReducer,

        // 其他业务模块在此扩展
        // question: questionReducer,
        // global: globalReducer,
    },
});
