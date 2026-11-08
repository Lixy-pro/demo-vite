/**
 * 输入框题目的组件 Props 类型
 *
 * 用途：
 * - 约束「输入框题型」组件（QuestionInput）接收的外部参数
 * - 同时作为「题目配置面板」的表单数据类型，保证编辑区和渲染区用同一份结构
 *
 * 字段说明：
 * - title       ：题目上方的标题文案，如「你的姓名」
 * - placeholder ：输入框内的占位提示，无输入时显示
 *
 * 设计约定：
 * - 两个字段都设为必填（不带 ?），意味着组件内部可以放心直接使用，
 *   无需再写 title ?? '' 之类的兜底
 * - 「必填」能成立，靠的就是下面的 DefaultProps 兜底，两者是一对配套设计
 */
export type QuestionInputPropsType = {
    /** 题目标题，展示在输入框上方 */
    title: string;

    /** 输入框占位提示文字 */
    placeholder: string;
};

/**
 * 输入框题目的默认属性值
 *
 * 用途：
 * - 新建一道输入框题目时，用它作为初始配置，用户不必从空白开始填
 * - 组件内部可用 `{ ...QuestionInputDefaultProps, ...props }` 合并，保证字段齐全
 *
 * 为什么类型是 Partial<QuestionInputPropsType>：
 * - Partial 把类型里的所有字段变成可选
 * - 语义上表示「这是一份可以不完整的值」，允许只覆盖其中一两个字段
 * - 如果直接用 QuestionInputPropsType，就强制默认值必须写全所有字段；
 *   以后新增字段时会逼着所有默认值对象一起改，Partial 更宽松
 *
 * 注意：
 * - 这里的文案是「占位示例文案」，用户实际使用时会在属性面板里改掉
 * - 默认值只负责「让组件有东西可显示」，不承担业务含义
 */
export const QuestionInputDefaultProps: Partial<QuestionInputPropsType> = {
    title: '输入框标题',
    placeholder: '请输入...',
};
