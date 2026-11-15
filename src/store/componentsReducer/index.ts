/* eslint-disable @typescript-eslint/no-explicit-any */
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
 *
 * 注意：
 * - 这里是「编辑态」数据，不是答题数据
 * - selectedId 是纯前端状态，后端不存储，刷新即丢失，这是预期行为
 * - 所有变更都通过 reducer 进行，不要绕过 store 直接改数组
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { ComponentPropsType } from '../../components/question';

/**
 * 单个组件在画布上的完整信息
 *
 * - fe_id   ：前端生成的唯一标识
 *              ⚠️ 不要用数组下标当 key，列表增删/排序时下标有变，
 *              会导致 React 复用错组件、输入框内容串位
 * - type    ：题型标识，渲染时从题型注册表查出 Component
 * - title   ：题目名称，显示在组件大纲/选中条上（不是问卷内容里的标题）
 * - props   ：该题型的配置，具体字段由 type 决定（联合类型，需按 type 收窄后访问）
 *
 * ⚠️ fe_id 生成：本 slice 不负责，由新增组件处用 nanoid/uuid 产出；
 *    接口历史数据字段名需在调用侧归一化为 fe_id
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
 * - selectedId   ：当前选中组件的 fe_id；'' 表示未选中
 *                  用空串而非 null/undefined，消费方判断统一为 fe_id === selectedId
 * - componentList：画布上的组件，顺序即渲染顺序
 */
export type ComponentsStateType = {
    selectedId: string;
    componentList: Array<ComponentInfoType>;
};

/**
 * 初始状态
 *
 * 只在 store 创建时用一次，之后所有变更通过 reducer 产生
 */
const INIT_STATE: ComponentsStateType = {
    selectedId: '',
    componentList: [],
};

export const componentsSlice = createSlice({
    name: 'components',
    initialState: INIT_STATE,

    /**
     * 同步 reducer 集合
     *
     * RTK 内部已集成 Immer，这里的 state 实际是 draft 代理对象，
     * 直接修改即可，不需要 return，也不需要手动引入 produce
     */
    reducers: {
        /**
         * 重置整个组件列表（含选中态）
         *
         * 触发时机：接口成功 / 切换问卷 / 新建空白问卷
         *
         * ⚠️ 要求调用方传完整 state 结构 { componentList, selectedId }
         * 漏传 selectedId 会清掉选中态
         */
        resetComponents: (
            _state: ComponentsStateType,
            action: PayloadAction<ComponentsStateType>
        ) => {
            // 整体替换：直接 return 新对象（这是唯一适合 return 的场景）
            return action.payload;
        },

        /**
         * 修改当前选中项
         *
         * 调用场景：
         * - EditCanvas：点击组件外壳 → changeSelectedId(fe_id)
         * - Edit 页面：点击画布空白 → changeSelectedId('')
         */
        changeSelectedId: (state: ComponentsStateType, action: PayloadAction<string>) => {
            state.selectedId = action.payload;
        },

        /**
         * 新增组件
         *
         * 插入位置：紧跟在当前选中项之后；无选中项时追加到末尾
         * 新增后自动选中该组件
         *
         * @param action.payload 完整的 ComponentInfoType（调用方负责生成 fe_id）
         */
        addComponent: (state: ComponentsStateType, action: PayloadAction<ComponentInfoType>) => {
            const newComponent = action.payload;
            const index = state.componentList.findIndex(c => c.fe_id === state.selectedId);

            if (index < 0) {
                state.componentList.push(newComponent);
            } else {
                state.componentList.splice(index + 1, 0, newComponent);
            }

            state.selectedId = newComponent.fe_id;
        },

        /**
         * 修改指定组件的 props
         *
         * 用新 props 浅覆盖旧 props，找不到 fe_id 时静默忽略
         *
         * ⚠️ 用了 any 绕过联合类型的属性冲突，
         * 后续若给各题型 props 加字面量 type 做成判别联合可去掉 any
         */
        changeComponentProps: (
            state: ComponentsStateType,
            action: PayloadAction<{ fe_id: string; newProps: ComponentPropsType }>
        ) => {
            const { fe_id, newProps } = action.payload;
            const curComp = state.componentList.find(c => c.fe_id === fe_id);
            if (!curComp) return;

            curComp.props = {
                ...(curComp.props as any),
                ...(newProps as any),
            };
        },
    },
});

export const { resetComponents, changeSelectedId, addComponent, changeComponentProps } =
    componentsSlice.actions;

export default componentsSlice.reducer;
