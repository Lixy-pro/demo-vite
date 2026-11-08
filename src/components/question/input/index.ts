/**
 * @description 问卷的输入框组件（题型注册入口）
 * @author 李老师
 *
 * ── 这个文件是干什么的 ──
 * 它不渲染任何 UI，作用是「把输入框题型登记到编辑器里」。
 * 编辑器不认识具体组件，只认识下面这个配置对象——
 * 拿到 type 就能找到组件，拿到 defaultProps 就能新建题目。
 *
 * ── 约定俗成的结构（ComponentConfType）──
 * 每种题型目录（如 QuestionInput/）都导出一个同样形状的对象：
 *   title       展示给用户看的名字
 *   type        全局唯一标识，存进数据里的是它
 *   Component   真正的渲染组件
 *   defaultProps 新建题目时的初始配置
 * 只要遵守这个结构，新增题型就不用改编辑器任何代码。
 */

// 真正的渲染组件：负责在画布上显示标题 + 输入框
import Component from './Component';

// 该题型的默认配置，用于「新建题目」时生成初始数据
import { QuestionInputDefaultProps } from './interface';

/**
 * 类型再导出
 *
 * 作用：
 * - 让外部只需 `import { QuestionInputPropsType } from './QuestionInput'`
 * - 不必关心 interface.ts 这个内部文件的位置
 * - 相当于把 interface 的内容「提升」到目录层级对外暴露
 *
 * 注意：
 * - 这里只导出类型，不导出默认值（默认值已挂到 defaultProps 上）
 * - 与上面的 default import 并存：一个导出配置对象，一个导出类型
 */
export * from './interface';

/**
 * 输入框题型的注册配置
 *
 * 消费方：
 * - 左侧「组件库」面板：读 title / type，渲染可拖拽的题型卡片
 * - 画布渲染器       ：按 type 找到 Component 并传入 props
 * - 新增题目逻辑     ：读 defaultProps 作为初始配置
 * - 属性面板         ：按 type 决定渲染哪套配置表单
 *
 * 字段说明：
 * - title：中文展示名，出现在组件库列表里
 * - type ：唯一标识。⚠️ 这个值会被序列化存进数据库，
 *          一旦上线就不要再改，改了会导致历史问卷找不到对应组件
 * - Component：真正的 React 组件
 * - defaultProps：新建时的初始配置，来自 interface.ts
 */
export default {
    title: '输入框',
    type: 'questionInput',
    Component,
    defaultProps: QuestionInputDefaultProps,
};
