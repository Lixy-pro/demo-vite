// 导入 React 组件类型 FC（FunctionComponent）
import type { FC } from 'react';

// 导入 Redux 提供的 hooks，用于获取状态和派发 action
import { useSelector, useDispatch } from 'react-redux';

// 导入 todoList 模块中定义的 action 创建函数
import { addTodo, removeTodo, toggleCompleted } from './store/todoList';

// 导入 Redux store 的根状态类型，用于类型约束
import type { StateType } from './store/index';

// 导入待办事项的数据类型
import type { TodoItemType } from './store/todoList';

// 导入 nanoid，用于生成唯一 ID
import { nanoid } from '@reduxjs/toolkit';

// 定义 TodoList 函数组件
const TodoList: FC = () => {
    // 从 store 中获取 todoList 状态
    // 由于 useSelector 的类型推导不够精确，这里使用类型断言明确为 TodoItemType[]
    const todoList = useSelector<StateType, TodoItemType[]>(state => state.todoList);

    // 获取 dispatch 方法，用于派发 action
    const dispatch = useDispatch();

    // 添加待办事项
    function add() {
        // 生成长度为 5 的唯一 ID
        const id = nanoid(5);

        // 构造新的待办事项对象
        const newTodo: TodoItemType = {
            id,
            title: `todo-${id}`,
            completed: false,
        };

        // 派发 addTodo action，将新事项加入 store
        dispatch(addTodo(newTodo));
    }

    // 删除待办事项
    function del(id: string) {
        // 派发 removeTodo action，并传入包含 id 的 payload
        dispatch(removeTodo({ id }));
    }

    // 切换待办事项的完成状态
    function toggle(id: string) {
        // 派发 toggleCompleted action，并传入包含 id 的 payload
        dispatch(toggleCompleted({ id }));
    }

    return (
        <>
            {/* 标题 */}
            <p>TodoList Demo</p>

            {/* 添加按钮区域 */}
            <div>
                <button onClick={add}>添加</button>
            </div>

            {/* 待办事项列表 */}
            <ul>
                {todoList.map(todo => {
                    // 解构当前待办事项的数据
                    const { id, title, completed } = todo;

                    return (
                        // 使用 id 作为列表 key
                        // 已完成的事项显示删除线
                        <li key={id} style={{ textDecoration: completed ? 'line-through' : '' }}>
                            {/* 点击文字切换完成状态 */}
                            <span onClick={() => toggle(id)}>{title}</span>&nbsp;
                            {/* 点击按钮删除当前事项 */}
                            <button onClick={() => del(id)}>删除</button>
                        </li>
                    );
                })}
            </ul>
        </>
    );
};

// 导出 TodoList 组件
export default TodoList;
