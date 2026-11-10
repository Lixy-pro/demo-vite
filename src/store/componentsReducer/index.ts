/**
 * @description 问卷组件列表的 Redux slice
 *
 * ── 职责 ──
 * 管理编辑器画布上的「组件列表 + 选中态」这两份唯一数据源：
 * - 画布按 componentList 顺序渲染各题型组件
 * - 画布按 selectedId 给当前项加高亮外壳
 * - 右侧属性面板按选中项的 props 渲染配置项
 * - 点击画布空白处清空 selectedId，面板回到空状态
 * - 保存问卷时直接把 componentList 序列化提交给后端
 *
 * ── 数据流向 ──
 * 接口返回问卷详情
 *   → useLoadQuestionData 调用 resetComponents（列表 + 默认选中第一项）
 *   → store.components 更新
 *   → 画布 / 属性面板重新渲染
 *
 * 用户交互
 *   → 点组件：changeSelectedId(fe_id)
 *   → 点空白：changeSelectedId('')
 *   → 画布外壳类名与属性面板内容随之切换
 *
 * 注意：
 * - 这里是「编辑态」数据，不是答题数据
 * - selectedId 是纯前端状态，后端不存储，刷新即丢失，这是预期行为
 * - 目前有「整体重置」和「改选中项」两个 action；
 *   后续增删、排序、改属性都应在这里加 reducer，
 *   不要绕过 store 直接改数组（视图不会更新，且改动无法回溯）
 */

// Redux Toolkit：用于创建 slice
import { createSlice } from '@reduxjs/toolkit';

// TS 类型：用于约束 action.payload 的结构
import type { PayloadAction } from '@reduxjs/toolkit';

// Immer 的 produce：用于把「直接改 draft」写成不可变更新
// - createSlice 内部已经集成了 Immer，reducer 里本就能直接改 state
// - 这里额外显式引入 produce，是为了把「改 draft」的逻辑抽成独立函数，
//   而不是只能写在 reducers 对象里
// - 两种写法最终效果一致，选哪种是风格问题，不要在同一处混着用
import { produce } from 'immer';

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
 *            渲染时靠它从题型注册表查出真正的 Component；
 *            查不到时（后端返回了前端未实现的题型）渲染层应给兜底 UI
 * - title  ：题目名称，显示在画布左侧的组件大纲 / 选中条上，
 *            与 props 里的标题文案不是一回事（那是给用户看的问卷内容）
 * - props  ：该题型的配置，具体字段由 type 决定
 *
 * 关于 props 的类型：
 * - 这里是联合类型，所以在 reducer / 组件里不能直接 props.title
 * - 必须先按 type 收窄，或断言成具体题型类型再访问
 * - 想彻底解决，可给各题型 props 加字面量 type 字段做成判别联合
 *
 * ⚠️ fe_id 的生成时机：
 * - 本 slice 不负责生成，由「新增组件」的地方用 nanoid / uuid 等产出
 * - 从接口拿到的历史数据里，后端字段可能叫 fe_id 或 id，
 *   需要在 useLoadQuestionData 那一层归一化成 fe_id
 */
export type ComponentInfoType = {
    fe_id: string;
    type: string;
    title: string;
    props: ComponentPropsType;
};

/**
 * 组件 slice 的状态结构
 *
 * 字段说明：
 * - selectedId   ：当前选中组件的 fe_id；'' 表示「没有选中任何项」
 *                  用空串而非 null/undefined，是为了让消费方的判断
 *                  统一成 fe_id === selectedId，不需要额外判空
 * - componentList：画布上的组件，顺序即渲染顺序（也是将来的拖拽排序结果）
 *
 * 为什么包成对象而不是直接用数组当 state：
 * - 数组当 state 的话，加选中态就得改结构、改所有消费方
 * - 包成对象后，新增字段只动这一个类型定义，下游按需取用即可
 * - 这也是 RTK 官方推荐的写法：state 用普通对象，字段各自独立演进
 */
export type ComponentsStateType = {
    selectedId: string;
    componentList: Array<ComponentInfoType>;
};

/**
 * 初始状态
 * - selectedId: '' —— 还没选中任何组件，属性面板应显示空状态
 * - componentList: [] —— 新建问卷时画布没有任何组件
 * - 用大写常量命名，与「可变 state」在视觉上区分开，避免误改
 *
 * 注意：这个常量只在 store 创建时用一次，
 * 之后所有变更都通过 reducer 产生，不要在任何地方直接引用它去「重置」
 */
const INIT_STATE: ComponentsStateType = {
    selectedId: '',
    componentList: [],
};

export const componentsSlice = createSlice({
    // slice 名称，同时作为 store 上的字段名，
    // 消费方通过 state.components 访问本 slice
    name: 'components',

    // 初始状态
    initialState: INIT_STATE,

    /**
     * 同步 reducer 集合
     *
     * RTK 的特性：
     * - 内部使用 Immer，所以「直接改 state」是合法的（写起来像可变，
     *   实际产出的是新引用，React 能正确感知变化）
     *
     * 本文件里两种写法并存：
     * - resetComponents：return 新对象（整体替换语义）
     * - changeSelectedId：改 draft（局部更新语义）
     * 各有各的表达力，选择依据是「这次改动是换掉整个 state 还是改一格」
     *
     * ⚠️ 铁律：同一个 reducer 里不要混用。
     *    一旦 return 了值，Immer 就丢弃对 draft 的所有修改，
     *    会出现「改了但没生效」这种极难查的问题
     */
    reducers: {
        /**
         * 重置整个组件列表（含选中态）
         *
         * 触发时机：
         * - 问卷详情接口请求成功（useLoadQuestionData）
         * - 切换到另一份问卷（必须整体替换，否则上一份的组件会残留）
         * - 新建空白问卷
         *
         * 参数说明：
         * - _state：旧状态。下划线前缀表示「有意不使用」，
         *           因为这是整体替换，旧值无关紧要，仅为满足函数签名占位
         * - action.payload：新的完整 state，形如
         *   { componentList, selectedId }
         *   目前 selectedId 由 useLoadQuestionData 算好（默认第一项的 fe_id，
         *   列表为空时为 ''）
         *
         * 实现说明：
         * - 直接返回 payload，用新对象整体替换旧 state
         * - RTK/Immer 约定：reducer 若返回了值，就用该返回值作为新 state，
         *   不再使用对 draft 的修改
         *
         * ⚠️ 注意 payload 的形状与来源：
         * - 这里要求调用方传「完整 state 结构」，而不是只传组件数组，
         *   漏传 selectedId 会把选中态一起清掉
         * - 后端返回的问卷数据里，组件数组的字段名需要在调用侧转换好
         * - 若直接把整个接口响应丢进来，多余字段会被带进 store
         *   （TS 只做结构检查，不拦多余字段），
         *   所以更稳的写法是在这里显式挑字段组装，而不是整包透传：
         *     return {
         *         selectedId: action.payload.selectedId,
         *         componentList: action.payload.componentList,
         *     };
         *
         * TODO：后续可补充的 action
         * - addComponent        新增组件（需生成 fe_id）
         * - changeComponentProps 修改选中项配置
         * - removeComponent     删除组件（删的若是选中项，要一并清空 selectedId）
         * - moveComponent       拖拽排序
         */
        resetComponents: (
            _state: ComponentsStateType,
            action: PayloadAction<ComponentsStateType>
        ) => {
            return action.payload;
        },

        /**
         * 修改当前选中项
         *
         * @param draft  可变的 state 草稿（Immer 代理对象）
         * @param action.payload 要选中的组件 fe_id；传 '' 表示取消选中
         *
         * 调用场景：
         * - EditCanvas：点击组件外壳 → changeSelectedId(fe_id)
         * - Edit 页面：点击画布空白 → changeSelectedId('')
         *
         * 为什么用 produce 包一层：
         * - createSlice 的 reducer 本来就能直接改 state，
         *   这里显式写 produce 是「把更新逻辑表达成纯函数」的风格选择：
         *   draft 的改动范围一目了然，也便于把这段逻辑抽出去复用或单测
         * - 注意：draft 上只能改「已有字段」，
         *   不能给 draft 整体重新赋值（那相当于 return，行为会变）
         *
         * 不需要校验 id 是否存在：
         * - 传入一个不存在的 fe_id 只会让所有外壳都不高亮、面板找不到选中项，
         *   属于「显示为空」而不是「数据错乱」，危害有限
         * - 若想更严格，可在这里判断 componentList.some(c => c.fe_id === payload)，
         *   不存在则忽略这次改动
         *
         * 与其他字段的关系：
         * - 只改 selectedId，不动 componentList，
         *   所以选中/取消选中不会引发画布列表重排，开销很小
         */
        changeSelectedId: produce((draft: ComponentsStateType, action: PayloadAction<string>) => {
            draft.selectedId = action.payload;
        }),
    },
});

/**
 * 导出 action creator
 * - 用法：
 *   dispatch(resetComponents({ componentList, selectedId }))
 *   dispatch(changeSelectedId(fe_id))
 * - RTK 自动生成对应的 type 字符串：
 *   'components/resetComponents'、'components/changeSelectedId'
 */
export const { resetComponents, changeSelectedId } = componentsSlice.actions;

/**
 * 导出 reducer
 * - 用于 configureStore 的 reducer 字段注册
 * - 在 store 上挂载为 state.components
 */
export default componentsSlice.reducer;
