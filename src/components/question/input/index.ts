/**
 * @description 输入框题型注册入口
 *
 * ── 职责 ──
 * 不渲染 UI，只导出一份「题型配置对象」，把输入框题型登记到编辑器。
 * 编辑器通过 type 查表找到 Component / PropComponent / defaultProps，
 * 新增题型只需加目录，不改编辑器核心代码。
 */

// 画布渲染组件
import Component from './Component';

// 右侧属性配置面板
import PropComponent from './PropComponent';

// 默认属性值（新建题目时的初始配置）
import { QuestionInputDefaultProps } from './interface';

/**
 * 类型再导出
 *
 * 让外部只需 `import { QuestionInputPropsType } from './QuestionInput'`
 * 不必关心 interface.ts 的内部路径
 */
export * from './interface';

/**
 * 题型注册配置
 *
 * 消费方：
 * - 组件库面板：读 title / type，渲染可拖拽卡片
 * - 画布渲染器：按 type 查 Component，传入 props 渲染
 * - 新增题目：复制 defaultProps 作为初始数据写入 store
 * - 属性面板：按 type 匹配 PropComponent，渲染配置表单
 *
 * ⚠️ type 一旦上线不要改——它会被序列化存进数据库，
 * 改了会导致历史问卷数据找不到对应组件
 */
export default {
    title: '输入框',
    type: 'questionInput',
    Component, // 画布渲染用
    PropComponent, // 右侧属性面板用
    defaultProps: QuestionInputDefaultProps,
};
