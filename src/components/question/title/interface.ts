/**
 * 标题题目的组件 Props 类型
 *
 * 用途：
 * - 约束「标题题型」组件（QuestionTitle）接收的外部参数
 * - 同时作为右侧属性面板的表单数据类型，保证编辑区与渲染区共用同一份结构
 *
 * 设计约定：
 * - 字段全部必填（不带 ?），组件内部可直接使用，无需判空
 * - 「必填」能成立，靠下面的 QuestionTitleDefaultProps 兜底，
 *   类型与默认值是一对配套设计，改动时要同步
 */
export type QuestionTitlePropsType = {
    /**
     * 标题文本内容
     * - 展示在问卷中的主文案，如「基本信息」
     * - 允许为空字符串，此时渲染出空标题占位
     */
    text: string;

    /**
     * 标题层级，对应 HTML 的 h1 ~ h5
     *
     * 为什么用字面量联合而不是 number：
     * - `1 | 2 | 3 | 4 | 5` 把取值锁死在合法范围内
     * - 属性面板里做下拉选择时，选项和类型天然对齐，不会出现 h6 或 h0
     * - 若写成 number，TS 无法拦住 level={9} 这种无效值
     *
     * 注意：
     * - 只到 5 不到 6，是有意收敛——h6 在问卷里层级过深、视觉太弱，基本用不上
     * - 与 antd Typography 的 level 属性一致，可直接透传
     */
    level: 1 | 2 | 3 | 4 | 5;

    /**
     * 是否居中显示
     * - true ：标题居中，常用于问卷主标题、分节标题
     * - false：左对齐，适合普通小标题
     *
     * 注意：
     * - 布尔字段默认 false，是「最不打扰」的取值
     * - 但布尔型有一个固有小坑：属性面板的开关组件若拿到 undefined，
     *   受控状态会出问题，所以这个字段尤其依赖默认值兜底
     */
    isCenter: boolean;
};

/**
 * 标题题目的默认属性值
 *
 * 用途：
 * - 新建一道标题题时作为初始配置，避免用户从空白开始
 * - 组件内可用 `{ ...QuestionTitleDefaultProps, ...props }` 合并，保证字段齐全
 *
 * 为什么类型是 Partial<QuestionTitlePropsType>：
 * - Partial 把所有字段变为可选，语义是「一份可以不完整的配置」
 * - 允许只覆盖其中一两个字段，后续新增字段时不必改所有默认值对象
 *
 * 默认值取向说明：
 * - text: '一行标题' —— 占位示例文案，用户会在属性面板改掉
 * - level: 1        —— 默认最大层级，因为标题题通常是分节主标题
 * - isCenter: false —— 默认左对齐，符合常规阅读习惯
 */
export const QuestionTitleDefaultProps: Partial<QuestionTitlePropsType> = {
    text: '一行标题',
    level: 1,
    isCenter: false,
};
