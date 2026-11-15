/**
 * @description 读取问卷组件列表的自定义 Hook
 *
 * ── 职责 ──
 * 从 store 中取出 components 分片，统一做兜底，
 * 让画布、属性面板等消费方只依赖返回值，不关心 store 的具体形状。
 *
 * 好处：
 * - 消费方只写 `const { componentList } = useGetComponentInfo()`
 * - 将来 state 结构变化（加字段、改嵌套），只改这一个文件
 * - 兜底逻辑只有一份，不会出现各消费方各自判空的不一致
 */

import { useSelector } from 'react-redux';

// 全局 Root State 类型
import type { StateType } from '../store';

// 组件模块 State 类型
import type { ComponentsStateType } from '../store/componentsReducer';

/**
 * 空状态兜底常量
 *
 * 为什么提到模块级：
 * - 写在选择器里每次执行都产生新对象，useSelector 的 === 比较会误判为变化，触发无谓重渲染
 * - 提到模块级后引用恒定，兜底路径也不会导致多余更新
 *
 * ⚠️ 只读约定：所有消费方共享这个对象，
 *    绝不能修改（push / 改属性），否则污染下一个读到它的组件
 *    已用 Object.freeze 加固
 */
const EMPTY_STATE: ComponentsStateType = Object.freeze({ componentList: [], selectedId: '' });

/**
 * 获取组件列表 + 当前选中项
 *
 * @returns { componentList, selectedId, selectedComponent }
 * - componentList：画布上的组件信息数组，永不为 undefined
 * - selectedId：当前选中组件的 fe_id，'' 表示未选中
 * - selectedComponent：当前选中项的完整信息，未选中时为 undefined
 *
 * 泛型说明：`useSelector<StateType, ComponentsStateType>`
 * - StateType：整个 store 的形状
 * - ComponentsStateType：本选择器的返回值类型
 */
function useGetComponentInfo() {
    /**
     * 从 store 取 components 分片
     *
     * 兜底针对的情况：
     * - store 配置漏挂 componentsReducer
     * - 单元测试 mock 了不完整的 state
     * 这两种情况下返回空结构，避免下游读 .componentList 抛错
     *
     * ⚠️ 代价：掩盖了真实问题
     * - 正常运行时 state.components 一定存在（INIT_STATE 已保证），
     *   走到 `||` 右侧说明 store 配置有 bug
     * - 兜底让 bug 表现为「画布空白」而不是明确报错，开发阶段可考虑去掉
     */
    const components = useSelector<StateType, ComponentsStateType>(
        state => state.components || EMPTY_STATE
    );

    /**
     * 解构出字段
     *
     * 不需要 `= []` 兜底：
     * - ComponentsStateType 里 componentList 是必填字段
     * - EMPTY_STATE 已保证兜底时也是数组
     * - TS 能确定不为 undefined，解构默认值属于冗余
     */
    const { componentList, selectedId } = components;

    // 从列表中找出当前选中项，找不到则返回 undefined
    const selectedComponent = componentList.find(c => c.fe_id === selectedId);

    return { componentList, selectedId, selectedComponent };
}

export default useGetComponentInfo;
