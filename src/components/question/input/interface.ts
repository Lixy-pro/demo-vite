/**
 * 输入框题型的 Props 类型
 *
 * 同时约束：渲染组件（QuestionInput）的入参 + 右侧属性面板的表单数据
 * 两者共用同一份结构，保证编辑区与渲染区一致
 *
 * 字段：
 * - title       ：题目标题，展示在输入框上方
 * - placeholder ：输入框占位提示
 * - onChange    ：属性面板修改配置时的回调，由面板传入
 *
 * 设计约定：
 * - 字段全部必填（不带 ?），组件内部可直接使用，无需兜底
 * - 「必填」靠下方的 DefaultProps 兜底，两者是一对配套设计
 */
export type QuestionInputPropsType = {
    title: string;
    placeholder: string;
    onChange: (newProps: QuestionInputPropsType) => void;
};

/**
 * 输入框题型的默认属性值
 *
 * 用途：
 * - 新建题目时的初始配置，用户不必从空白开始填
 * - 组件内用 `{ ...QuestionInputDefaultProps, ...props }` 合并，保证字段齐全
 *
 * 为什么用 Partial：
 * - Partial 把所有字段变为可选，允许只覆盖部分字段
 * - 新增字段时不必强制改所有默认值对象，扩展性更好
 */
export const QuestionInputDefaultProps: Partial<QuestionInputPropsType> = {
    title: '输入框标题',
    placeholder: '请输入...',
};
