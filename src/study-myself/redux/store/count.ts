// 从 Redux Toolkit 中导入 createSlice，用于快速创建 slice（包含 reducer 和 actions）
import { createSlice } from '@reduxjs/toolkit';

// 定义 count 模块的初始状态，初始值为 100
const INIT_STATE: number = 100;

// 使用 createSlice 创建 count 相关的 slice
export const countSlice = createSlice({
    // slice 的名称，用于在 Redux DevTools 和 action type 中标识
    name: 'count',

    // 初始状态
    initialState: INIT_STATE,

    // 定义同步 reducer 及对应的 action
    reducers: {
        // 增加计数：返回原状态值 + 1
        increase(state: number) {
            return state + 1;
        },

        // 减少计数：返回原状态值 - 1
        decrease(state: number) {
            return state - 1;
        },
    },
});

// 导出自动生成的 action 创建函数，供组件 dispatch 使用
export const { increase, decrease } = countSlice.actions;

// 导出 reducer，用于组合到 store 中
export default countSlice.reducer;
