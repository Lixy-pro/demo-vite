// 从 Redux Toolkit 中导入 createSlice 用于创建 slice，nanoid 用于生成唯一 ID
import { createSlice, nanoid } from '@reduxjs/toolkit';

// 导入 PayloadAction 类型，用于为 action.payload 提供 TypeScript 类型支持
import type { PayloadAction } from '@reduxjs/toolkit';

// 定义单个待办事项的数据类型
export type TodoItemType = {
    // 待办事项唯一标识
    id: string;

    // 待办事项标题
    title: string;

    // 是否已完成
    completed: boolean;
};

// 定义初始状态：一个 TodoItemType 数组
const INIT_STATE: TodoItemType[] = [
    {
        // 生成长度为 5 的唯一 ID
        id: nanoid(5),
        title: '吃饭',
        completed: true,
    },
    {
        id: nanoid(5),
        title: '睡觉',
        completed: false,
    },
];

// 创建 todoList 相关的 slice
export const todoListSlice = createSlice({
    // slice 名称，用于生成 action type（如 'todoList/addTodo'）
    name: 'todoList',

    // 初始状态
    initialState: INIT_STATE,

    // 定义同步 reducer
    reducers: {
        // 添加待办事项
        // action.payload 为新增的待办事项对象
        addTodo(state: TodoItemType[], action: PayloadAction<TodoItemType>) {
            // 将新待办事项放到列表最前面（不可变更新）
            // return state.concat(action.payload);
            return [action.payload, ...state];
        },

        // 删除待办事项
        // action.payload 中包含要删除的待办事项 ID
        removeTodo(state: TodoItemType[], action: PayloadAction<{ id: string }>) {
            const { id: removeId } = action.payload;

            // 过滤掉指定 ID 的待办事项
            return state.filter(todo => todo.id !== removeId);
        },

        // 切换待办事项的完成状态
        // action.payload 中包含要切换状态的待办事项 ID
        toggleCompleted(state: TodoItemType[], action: PayloadAction<{ id: string }>) {
            const { id: toggleId } = action.payload;

            // 遍历列表，仅更新匹配 ID 的待办事项
            return state.map(todo => {
                const { id, completed } = todo;

                // 如果不是目标待办事项，直接返回原对象
                if (id !== toggleId) return todo;

                // 切换 completed 状态（使用扩展运算符保持对象不可变）
                return {
                    ...todo,
                    completed: !completed,
                };
            });
        },
    },
});

// 导出自动生成的 action 创建函数，供组件 dispatch 使用
export const { addTodo, removeTodo, toggleCompleted } = todoListSlice.actions;

// 导出 reducer，用于组合到 Redux store 中
export default todoListSlice.reducer;
