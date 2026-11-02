// 导入 React 组件类型 FC（FunctionComponent）
import type { FC } from 'react';

// 导入 Redux 提供的 hooks，用于获取状态和派发 action
import { useSelector, useDispatch } from 'react-redux';

// 导入 count 模块中定义的 action 创建函数
import { increase, decrease } from './store/count';

// 导入 Redux store 的根状态类型，用于类型约束
import type { StateType } from './store/index';

// 定义 Count 函数组件
const Count: FC = () => {
    // 从 store 中获取 count 状态
    // useSelector 的泛型参数指定为 StateType，保证 state 的类型安全
    const count = useSelector<StateType, number>(state => state.count);

    // 获取 dispatch 方法，用于派发 action
    const dispatch = useDispatch();

    return (
        <div>
            {/* 标题 */}
            <p>计数器</p>

            {/* 展示当前计数 */}
            <span>
                <>count:{count}</>
            </span>

            {/* 点击按钮，派发 increase action，计数器 +1 */}
            <button onClick={() => dispatch(increase())}>+</button>

            {/* 点击按钮，派发 decrease action，计数器 -1 */}
            <button onClick={() => dispatch(decrease())}>-</button>
        </div>
    );
};

// 导出 Count 组件
export default Count;
