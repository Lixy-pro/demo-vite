/**
 * @description 标题题型渲染组件
 *
 * ── 职责 ──
 * 在画布 / 预览中渲染一道「标题题型」：
 * 按 level 控制层级与字号，按 isCenter 控制对齐方式
 *
 * ── 使用场景 ──
 * - 编辑器画布：展示标题外观，供用户调整层级与对齐
 * - 填写页预览：查看最终效果
 * - 展示型题目，不收集答案，作用是对问卷做分节与视觉分层
 */

import type { FC } from 'react';
import { Typography } from 'antd';

// Props 类型定义 + 默认配置
import type { QuestionTitlePropsType } from './interface';
import { QuestionTitleDefaultProps } from './interface';

const { Title } = Typography;

/**
 * 层级 → 字号映射表
 *
 * 为什么用 Record 查表而不是 if 链：
 * - 键的类型锁死为 `1 | 2 | 3 | 4 | 5`，漏写一个 TS 当场报错
 * - if 链的兜底 return 会悄悄吞掉未处理的层级，加新层级时无提示
 * - 纯数据、无副作用，放组件外避免每次渲染重建
 *
 * 字号取向：
 * - 1 → 24px：分节主标题（antd 默认约 38px，会撑爆画布）
 * - 2 → 20px：次级标题
 * - 3/4/5 → 16px：与正文接近，保持小标题尺寸即可
 */
const LEVEL_FONT_SIZE: Record<QuestionTitlePropsType['level'], string> = {
    1: '24px',
    2: '20px',
    3: '16px',
    4: '16px',
    5: '16px',
};

/**
 * 取指定层级的字号
 */
const genFontSize = (level: QuestionTitlePropsType['level']) => LEVEL_FONT_SIZE[level];

/**
 * 标题题目组件
 *
 * Props 为 Partial：外部可能只传部分配置
 * 组件内合并默认值保证字段齐全，渲染时无需再做兜底判断
 */
const QuestionTitle: FC<Partial<QuestionTitlePropsType>> = props => {
    /**
     * 合并默认值与传入值
     *
     * 顺序：默认值先铺，props 后覆盖（props 优先级更高）
     * 解构时的 `= 1` / `= false` 是双保险——
     * 只有外部显式传 `{ level: undefined }` 时才会触发
     */
    const {
        text = '',
        level = 1,
        isCenter = false,
    } = {
        ...QuestionTitleDefaultProps,
        ...props,
    };

    return (
        <Title
            // 层级透传给 antd，影响语义标签（h1~h5）与样式基线
            level={level}
            style={{
                // 'start' 跟随文本方向，LTR 时等同 left，RTL 时自动靠右
                textAlign: isCenter ? 'center' : 'start',

                // 去掉 antd Title 默认下边距，统一交给外层题目间距控制
                marginBottom: '0',

                // 用问卷专用字号覆盖 antd 默认尺寸
                fontSize: genFontSize(level),
            }}
        >
            {text}
        </Title>
    );
};

export default QuestionTitle;
