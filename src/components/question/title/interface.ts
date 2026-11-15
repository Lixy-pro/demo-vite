/**
 * 标题题型的 Props 类型
 *
 * 同时约束：渲染组件（QuestionTitle）的入参 + 右侧属性面板的表单数据
 * 两者共用同一份结构，保证编辑区与渲染区一致
 *
 * 设计约定：
 * - 字段全部必填（不带 ?），组件内部可直接使用，无需判空
 * - 「必填」靠下方的 DefaultProps 兜底，类型与默认值是一对配套设计，改动时同步
 */
export type QuestionTitlePropsType = {
    /**
     * 标题文本内容
     * - 展示在问卷中的主文案，如「基本信息」
     * - 允许为空字符串，此时渲染出空标题占位
     */
    text: string;

    /**
     * 标题层级，对应 HTML h1 ~ h5
     *
     * 为什么用字面量联合而不是 number：
     * - `1 | 2 | 3 | 4 | 5` 把取值锁死在合法范围内
     * - 属性面板下拉选项与类型天然对齐，不会出现 h0 / h6 等无效值
     * - 若写成 number，TS 无法拦住 level={9}
     *
     * 只到 5 不到 6 是有意收敛——h6 在问卷里层级过深、视觉太弱，基本用不上
     * 与 antd Typography 的 level 属性一致，可直接透传
     */
    level: 1 | 2 | 3 | 4 | 5;

    /**
     * 是否居中显示
     * - true ：标题居中，常用于问卷主标题、分节标题
     * - false：左对齐，适合普通小标题
     *
     * ⚠️ 布尔字段依赖默认值兜底：
     * - 属性面板的 Switch 组件若拿到 undefined，受控状态会出问题
     * - 所以 isCenter 必须有默认值，不能让它变成 undefined
     */
    isCenter: boolean;

    onChange: (newProps: QuestionTitlePropsType) => void;
};

/**
 * 标题题型的默认属性值
 *
 * 用途：
 * - 新建题目时的初始配置，用户不必从空白开始填
 * - 组件内用 `{ ...QuestionTitleDefaultProps, ...props }` 合并，保证字段齐全
 *
 * 为什么用 Partial：
 * - 把所有字段变为可选，允许只覆盖部分字段
 * - 新增字段时不必强制改所有默认值对象，扩展性更好
 *
 * 默认值取向：
 * - text: '一行标题'  —— 占位示例，用户会在面板里改掉
 * - level: 1         —— 默认最大层级，标题题通常作分节主标题
 * - isCenter: false  —— 默认左对齐，符合常规阅读习惯
 */
export const QuestionTitleDefaultProps: Partial<QuestionTitlePropsType> = {
    text: '一行标题',
    level: 1,
    isCenter: false,
};
