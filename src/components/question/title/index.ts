/**
 * @description 问卷的标题组件（题型注册入口）
 * @author 李老师
 *
 * ── 这个文件是干什么的 ──
 * 它不渲染任何 UI，作用是「把标题题型登记进编辑器」。
 * 编辑器不直接 import 具体组件，只认下面这个配置对象：
 * 拿到 type 就能查到组件，拿到 defaultProps 就能新建题目。
 *
 * ── 统一结构（ComponentConfType）──
 * 每种题型目录都导出同样形状的对象：
 *   title        给用户看的名字
 *   type         全局唯一标识，会被存进数据
 *   Component    真正的渲染组件
 *   defaultProps 新建题目时的初始配置
 * 遵守这个结构，新增题型就不用改编辑器本体代码。
 */

// 真正的渲染组件：负责按 level / isCenter 渲染标题
import Component from './Component';

// 该题型的默认配置，用于「新建标题题」时生成初始数据
import { QuestionTitleDefaultProps } from './interface';

/**
 * 类型再导出
 *
 * 作用：
 * - 外部只需 `import { QuestionTitlePropsType } from './QuestionTitle'`
 * - 不必知道 interface.ts 这个内部文件的存在
 * - 把 interface 的内容提升到目录层级对外暴露
 *
 * 注意：
 * - 只导出类型，默认值已挂到 defaultProps 上
 * - 与默认导出并存，二者用途不同、互不冲突
 */
export * from './interface';

/**
 * 标题题型的注册配置
 *
 * 消费方：
 * - 左侧组件库面板：读 title / type，渲染可拖拽的题型卡片
 * - 画布渲染器    ：按 type 找到 Component 并传入 props
 * - 新增题目逻辑  ：读 defaultProps 作为初始配置
 * - 右侧属性面板  ：按 type 决定渲染哪套配置表单（标题是 text + level + isCenter）
 *
 * 字段说明：
 * - title：中文展示名，出现在组件库列表里
 * - type ：唯一标识。⚠️ 会被序列化存进数据库，上线后不可修改，
 *          否则历史问卷里的标题题会找不到对应组件而渲染失败
 * - Component   ：真正的 React 组件
 * - defaultProps：来自 interface.ts，保证新建时就有合理外观
 *
 * 与输入框题型的差异：
 * - 标题题属于「展示型」题目，不收集答案，只做分节与视觉层级
 * - 因此它的配置里没有 placeholder 这类输入相关字段，
 *   而是 level / isCenter 这类排版字段
 */
export default {
    title: '标题',
    type: 'questionTitle',
    Component,
    defaultProps: QuestionTitleDefaultProps,
};
