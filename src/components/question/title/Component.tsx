/**
 * @description 问卷的标题题目组件
 *
 * ── 职责 ──
 * 在画布 / 预览中渲染一道「标题题型」：
 * 按 level 控制层级与字号，按 isCenter 控制对齐方式
 *
 * ── 使用场景 ──
 * - 编辑器画布：展示标题外观，供用户调整层级与对齐
 * - 填写页预览：查看最终效果
 * - 标题题属于「展示型题目」，不收集答案，作用是对问卷做分节与视觉分层
 */

import type { FC } from 'react';
import { Typography } from 'antd';

import type { QuestionTitlePropsType } from './interface';
import { QuestionTitleDefaultProps } from './interface';

const { Title } = Typography;

/**
 * 层级 → 字号映射表
 *
 * 为什么用查表代替 if 链：
 * - 键的类型是 QuestionTitlePropsType['level']（即 1|2|3|4|5），
 *   Record 要求「每个键都必须写全」，漏一个 TS 当场报错
 * - if 链的兜底 return 会悄悄把未处理的层级也返回 16px，
 *   加新层级时不会有任何提示，属于隐性 bug
 * - 纯数据、无副作用，放在组件外避免每次渲染重建
 *
 * 字号取向（覆盖 antd Title 默认尺寸）：
 * - 1 → 24px：分节主标题（antd 默认约 38px，会撑爆画布）
 * - 2 → 20px：次级标题
 * - 3 → 16px：小标题
 * - 4/5 → 16px：与正文接近，保持小标题尺寸即可
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
 *
 * @param level 标题层级 1~5
 * @returns 带单位的字号字符串
 */
const genFontSize = (level: QuestionTitlePropsType['level']) => LEVEL_FONT_SIZE[level];

/**
 * 标题题目组件
 *
 * Props 为 Partial：
 * - 外部可能只传一部分配置（如只改了 isCenter）
 * - 组件内合并默认值保证字段齐全，下面可直接当确定类型使用
 */
const QuestionTitle: FC<Partial<QuestionTitlePropsType>> = props => {
    /**
     * 合并默认值与传入值
     * - 先铺默认值再用 props 覆盖，顺序不能反
     * - 解构兜底是双保险：仅当外部显式传 `{ isCenter: undefined }` 时才生效
     *   （展开运算符不跳过 undefined 值，会用 undefined 盖掉默认值）
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
                // 'start' 跟随文本方向，LTR 时等同 left，RTL 时自动靠右，比 'left' 更正确
                textAlign: isCenter ? 'center' : 'start',

                // 去掉 antd Title 默认下边距，避免画布上题目间距忽大忽小，
                // 统一交给外层「题目间距」控制
                marginBottom: '0',

                // 用问卷专用字号覆盖 antd 默认尺寸
                fontSize: genFontSize(level),
            }}
        >
            {/* 标题文本，空字符串时渲染为空标题，占位但不塌陷 */}
            {text}
        </Title>
    );
};

export default QuestionTitle;
