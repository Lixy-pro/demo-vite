/**
 * @description 问卷的输入框题目组件
 *
 * ── 职责 ──
 * 在画布 / 预览中渲染一道「输入框题型」：
 * 上方标题（Paragraph）+ 下方输入框（Input）
 *
 * ── 使用场景 ──
 * - 编辑器画布：展示题目外观，供用户调整布局
 * - 填写页预览：查看最终效果
 * - 注意：它只负责「长什么样」，不负责收集答案，
 *   真正的答题数据由外层表单统一接管
 */

import type { FC } from 'react';
import { Typography, Input } from 'antd';

// Props 类型定义
import type { QuestionInputPropsType } from './interface';
// 默认配置，用于补齐外部没传的字段
import { QuestionInputDefaultProps } from './interface';

const { Paragraph } = Typography;

/**
 * 输入框题目组件
 *
 * Props 类型为 Partial：
 * - 外部可能只传一部分配置（如只改了 title）
 * - 组件内部通过合并默认值保证字段齐全
 * - 因此在组件体内可以放心把 title / placeholder 当作 string 使用
 */
const QuestionInput: FC<Partial<QuestionInputPropsType>> = props => {
    /**
     * 合并默认值与传入值
     *
     * 写法拆解：`{ ...QuestionInputDefaultProps, ...props }`
     * - 先铺默认值，再用 props 覆盖 → props 优先级更高
     * - 顺序不能反，反了默认值会把外部配置盖掉
     *
     * 再对结果做解构并给兜底：
     * - `title = ''` 这一层兜底其实是「双保险」
     * - 因为默认值里已经有 title / placeholder，正常不会走到兜底
     * - 只有当外部显式传了 `{ title: undefined }` 时，展开才会覆盖成 undefined，
     *   此时解构默认值才真正生效
     *   （展开运算符不会跳过值为 undefined 的键）
     *
     * 结果：
     * - title / placeholder 的类型都是确定的 string
     * - 后面渲染无需再写 title ?? '' 之类判断
     */
    const { title = '', placeholder = '' } = {
        ...QuestionInputDefaultProps,
        ...props,
    };

    return (
        <div>
            {/**
             * 题目标题
             * - strong：加粗，与题目内容做视觉层级区分
             * - 空字符串时渲染出空段落，占位但不显示内容，
             *   保证布局高度稳定，不会因标题为空而塌陷
             */}
            <Paragraph strong>{title}</Paragraph>

            {/**
             * 输入框区域
             * - 外层 div 用于预留后续扩展位置（如必填星号、说明文字）
             * - placeholder 透传，让用户能直接看到最终提示文案
             *
             * ⚠️ 关于交互：
             * - 在编辑器画布中，这个 Input 是「看得见但点不动」的展示件
             * - 若发现点击后能输入且影响不到数据，属于预期表现，
             *   需要时可在外层加 pointerEvents: 'none' 或加 readonly 禁止交互
             */}
            <div>
                <Input placeholder={placeholder} tabIndex={-1}></Input>
            </div>
        </div>
    );
};

export default QuestionInput;
