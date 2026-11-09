/**
 * @description 读取问卷组件列表的自定义 Hook
 *
 * ── 存在的意义 ──
 * 把「从 store 里取组件列表」这件事收敛到一个地方，
 * 让画布、属性面板等消费方不用各自写 useSelector + 兜底逻辑。
 *
 * 好处：
 * - 消费方只依赖 { componentList }，不关心 store 的具体形状
 * - 将来 state 结构变化（比如加选中态、加分页），只改这一个文件
 * - 兜底逻辑只有一份，不会出现「有的地方兜了、有的地方没兜」
 *
 * ── 使用示例 ──
 * const { componentList } = useGetComponentInfo();
 * {componentList.map(c => <div key={c.fe_id}>...</div>)}
 */

// Redux：用于从全局状态中读取数据
import { useSelector } from 'react-redux';

// 全局 Root State 类型
import type { StateType } from '../store';

// 组件模块 State 类型（供 useSelector 泛型标注返回值）
import type { ComponentsStateType } from '../store/componentsReducer';

/**
 * 空状态兜底常量
 *
 * 为什么提到模块外：
 * - 写在选择器里的话，`{ componentList: [] }` 每次执行都是新对象，
 *   useSelector 用 === 比较结果，会误判为「状态变了」→ 无谓重渲染
 * - 提到模块级后引用恒定，兜底路径也不会触发多余更新
 *
 * ⚠️ 只读约定：这个对象被所有消费方共享，
 *    绝不能在任何地方修改它（push / 改属性），
 *    否则会污染下一个读到它的组件。
 *    想更保险可加 Object.freeze
 */
const EMPTY_STATE: ComponentsStateType = Object.freeze({ componentList: [] });

/**
 * 获取组件列表
 *
 * @returns { componentList } 画布上的组件信息数组，正常情况永不为 undefined
 *
 * 泛型说明：`useSelector<StateType, ComponentsStateType>`
 * - 第一个参数 StateType：整个 store 的形状，让 state 有类型提示
 * - 第二个参数 ComponentsStateType：本选择器的返回值类型
 * - 显式标注是因为 TS 有时无法从选择器函数完美推断返回类型，
 *   标清楚后下游拿到的是确定类型而不是 any
 */
function useGetComponentInfo() {
    /**
     * 从 store 中取出 components 分片
     *
     * `state => state.components || EMPTY_STATE`
     *
     * 兜底针对的情况：
     * - store 配置漏挂 componentsReducer
     * - 单元测试里 mock 了一个不完整的 state
     * 这两种情况下返回空结构，避免下游读 .componentList 直接抛错
     *
     * ⚠️ 代价：它掩盖了真实问题
     * - 正常运行时 state.components 一定存在（INIT_STATE 已保证），
     *   能走到 `||` 右侧就说明 store 配置有 bug
     * - 兜底会让这个 bug 表现为「画布空白」而不是明确报错，反而更难查
     * - 开发阶段可考虑去掉兜底，让问题尽早暴露；
     *   生产环境再保留，避免整页崩掉
     *
     * 引用稳定性（已解决）：
     * - 正常路径返回 state.components，引用不变，不会多余渲染
     * - 兜底路径现在返回模块级常量 EMPTY_STATE，引用同样稳定
     *   （原先是内联对象字面量，每次都是新引用，会触发无谓重渲染）
     */
    const components = useSelector<StateType, ComponentsStateType>(
        state => state.components || EMPTY_STATE
    );

    /**
     * 解构出组件列表
     *
     * 注意：这里去掉了原先的 `= []` 默认值。
     * - 因为 ComponentsStateType 里 componentList 是必填字段，
     *   且上面已经用 EMPTY_STATE 保证了 components 一定有个数组，
     *   TS 能确定它不为 undefined，解构默认值属于冗余
     * - 副作用：如果传入的 state 里 componentList 恰好是 undefined
     *   （比如接口返回了脏数据），下游 .map() 会直接报错。
     *   若想更稳，可以改回 `const { componentList = [] } = components;`
     *   或在 reducer 里做归一化，保证这个字段永远是数组
     */
    const { componentList } = components;

    /**
     * 返回值刻意包成对象而不是直接返回数组：
     * - 后续要加 selectedId、selectedComponent 等字段时，
     *   不用改消费方的写法（他们已经在解构了）
     * - 直接返回数组的话，加字段就得改返回类型成元组或对象，
     *   属于破坏性变更
     */
    return { componentList };
}

export default useGetComponentInfo;
