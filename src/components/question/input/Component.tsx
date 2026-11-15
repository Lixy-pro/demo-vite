/**
 * @description 输入框题型渲染组件
 *
 * ── 职责 ──
 * 在画布 / 预览中渲染一道「输入框题型」：
 * 上方标题（Paragraph）+ 下方输入框（Input）
 *
 * ── 使用场景 ──
 * - 编辑器画布：展示题目外观，供用户调整配置
 * - 填写页预览：查看最终效果
 * - 只负责「长什么样」，不负责收集答案
 *   答题数据由外层表单统一接管
 */

import type { FC } from 'react';
import { Typography, Input } from 'antd';

// Props 类型定义 + 默认配置
import type { QuestionInputPropsType } from './interface';
import { QuestionInputDefaultProps } from './interface';

const { Paragraph } = Typography;

/**
 * 输入框题目组件
 *
 * Props 为 Partial：外部可能只传部分配置（如只改了 title）
 * 组件内部合并默认值，保证字段齐全，渲染时无需再做兜底判断
 */
const QuestionInput: FC<Partial<QuestionInputPropsType>> = props => {
    /**
     * 合并默认值与传入值
     *
     * 顺序：默认值先铺，props 后覆盖（props 优先级更高）
     * 解构时的 `= ''` 是双保险——默认值对象里已有 title/placeholder，
     * 正常不会走到；只有外部显式传 `{ title: undefined }` 时才会触发
     */
    const { title = '', placeholder = '' } = {
        ...QuestionInputDefaultProps,
        ...props,
    };

    return (
        <div>
            {/**
             * 题目标题
             * - strong：加粗，与输入区域做视觉层级区分
             * - 即使 title 为空字符串，也渲染空段落占位，
             *   保证布局高度稳定，不会因标题为空而塌陷
             */}
            <Paragraph strong>{title}</Paragraph>

            {/**
             * 输入框
             * - tabIndex={-1}：让画布中的输入框不可获焦，
             *   点击会落到组件外壳上触发选中，而不是在输入框里打字
             * - placeholder 透传，让用户直接看到最终提示文案
             */}
            <div>
                <Input placeholder={placeholder} tabIndex={-1} />
            </div>
        </div>
    );
};

export default QuestionInput;
