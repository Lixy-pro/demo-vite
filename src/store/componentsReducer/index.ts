/**
 * @description 问卷组件列表的 Redux slice
 *
 * ── 职责 ──
 * 管理编辑器画布上的「组件列表」这一份唯一数据源：
 * - 画布按 componentList 顺序渲染各题型组件
 * - 右侧属性面板按当前选中项的 props 渲染配置项
 * - 保存问卷时直接把 componentList 序列化提交给后端
 *
 * ── 数据流向 ──
 * 接口返回问卷详情
 *   → useLoadQuestionData 调用 resetComponents
 *   → store.componentList 更新
 *   → 画布 / 属性面板重新渲染
 *
 * 注意：
 * - 这里是「编辑态」数据，不是答题数据
 * - 目前只有整体重置一个 action，
 *   后续增删、排序、改属性都应在这里加 reducer，不要绕过 store 直接改数组
 */

// Redux Toolkit：用于创建 slice
import { createSlice } from '@reduxjs/toolkit';

// TS 类型：用于约束 action.payload 的结构
import type { PayloadAction } from '@reduxjs/toolkit';

// 题型 props 的联合类型（QuestionInputPropsType | QuestionTitlePropsType）
import type { ComponentPropsType } from '../../components/question';

/**
 * 单个组件在画布上的完整信息
 *
 * 字段说明：
 * - fe_id  ：前端生成的唯一标识
 *            ⚠️ 不要用数组下标当 key。列表会增删、拖拽排序，
 *               下标会变，导致 React 复用错组件、输入框内容串位。
 *               这个 id 同时用于「选中态」的定位，必须稳定且唯一
 * - type   ：题型标识，对应各题型注册文件里的 type（如 'questionInput'）
 *            渲染时靠它从题型注册表 Map 里查出真正的 Component
 * - title  ：题目名称，显示在画布左侧的组件大纲 / 选中条上，
 *            与 props 里的标题文案不是一回事（那是给用户看的问卷内容）
 * - props  ：该题型的配置，具体字段由 type 决定
 *
 * 关于 props 的类型：
 * - 这里是联合类型，所以在 reducer / 组件里不能直接 props.title
 * - 必须先按 type 收窄，或断言成具体题型类型再访问
 * - 想彻底解决，可给各题型 props 加字面量 type 字段做成判别联合
 */
export type ComponentInfoType = {
    fe_id: string;
    type: string;
    title: string;
    props: ComponentPropsType;
};

/**
 * 组件列表 slice 的状态结构
 *
 * 目前只有一个字段，但刻意包了一层对象而不是直接用数组：
 * - createSlice 的 state 必须是对象或数组都能工作，
 *   但包成对象后，后续加 selectedId、hasError 等字段时
 *   不用改结构、不用改所有消费方，扩展性更好
 */
export type ComponentsStateType = {
    componentList: Array<ComponentInfoType>;
};

/**
 * 初始状态
 * - 空列表：新建问卷时画布没有任何组件
 * - 用大写常量命名，与「可变 state」在视觉上区分开，避免误改
 */
const INIT_STATE: ComponentsStateType = {
    componentList: [],
};

export const componentsSlice = createSlice({
    // slice 名称，同时作为 store 上的字段名：
    // store.components.componentList
    name: 'components',

    // 初始状态
    initialState: INIT_STATE,

    /**
     * 同步 reducer 集合
     *
     * RTK 的特性：
     * - 内部使用 Immer，所以「直接改 state」是合法的（写起来像可变）
     * - 但这里选择「return 一个新对象」的整体替换写法，
     *   语义更明确：reset 就是丢弃旧列表、换成新列表
     * - 两种写法不要混用，同一个 reducer 里要么改 state、要么返回新值
     */
    reducers: {
        /**
         * 重置整个组件列表
         *
         * 触发时机：
         * - 问卷详情接口请求成功（useLoadQuestionData）
         * - 切换到另一份问卷（必须整体替换，否则上一份的组件会残留）
         * - 新建空白问卷
         *
         * 参数说明：
         * - _state：旧状态。下划线前缀表示「有意不使用」，
         *           因为这是整体替换，旧值 irrelevant，仅为满足函数签名占位
         * - action.payload：接口返回的完整 state 结构 { componentList }
         *
         * 实现说明：
         * - 直接返回 payload，用新对象整体替换旧 state
         * - RTK/Immer 约定：reducer 若返回了值，就用该返回值作为新 state，
         *   不再使用对 draft 的修改
         *
         * ⚠️ 注意 payload 的来源：
         * - 后端返回的问卷数据里，组件数组的字段名可能是 componentList，
         *   也可能叫 componentList 之外的名字，需要在调用侧转换好再 dispatch
         * - 若直接把整个接口响应丢进来，多余字段会被带进 store
         *   （TS 只做结构检查，不拦多余字段）
         *
         * TODO：后续可补充的 action
         * - addComponent     新增组件
         * - changeComponentProps 修改选中项配置
         * - removeComponent  删除组件
         * - moveComponent    拖拽排序
         */
        resetComponents: (
            _state: ComponentsStateType,
            action: PayloadAction<ComponentsStateType>
        ) => {
            return action.payload;
        },
    },
});

/**
 * 导出 action creator
 * - 用法：dispatch(resetComponents({ componentList }))
 * - RTK 自动生成 type 字符串为 'components/resetComponents'
 */
export const { resetComponents } = componentsSlice.actions;

/**
 * 导出 reducer
 * - 用于 configureStore 的 reducer 字段注册
 * - 在 store 上挂载为 state.components
 */
export default componentsSlice.reducer;
