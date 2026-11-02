// 从 Redux Toolkit 中导入 configureStore，用于创建 Redux store
import { configureStore } from '@reduxjs/toolkit';

// 导入 count 模块的 reducer
import countReducer from './count';

// 导入 todoList 模块的 reducer
import todoListReducer from './todoList';

// 导入 TodoItemType 类型，用于定义 store 中 todoList 状态的类型
import type { TodoItemType } from './todoList';

// 定义 Redux store 的根状态类型（RootState）
export type StateType = {
    // count 模块的状态，类型为 number
    count: number;

    // todoList 模块的状态，类型为 TodoItemType 数组
    todoList: TodoItemType[];
};

// 使用 configureStore 创建并导出 Redux store
export default configureStore({
    // reducer 合并配置（等同于 combineReducers）
    reducer: {
        // count 状态由 countReducer 管理
        count: countReducer,

        // todoList 状态由 todoListReducer 管理
        todoList: todoListReducer,
    },
});
