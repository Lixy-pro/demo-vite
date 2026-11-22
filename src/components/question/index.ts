/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @description 题型体系的总出口：类型联合 + 运行时注册表
 *
 * ── 职责 ──
 * 同时承担「编译期类型契约」和「运行期查表」两件事：
 * - ComponentPropsType：所有题型 Props 的联合类型，供 store / 属性面板消费
 * - componentConfList  ：所有题型的注册配置数组，供渲染时按 type 查表
 *
 * ── 新增题型必改两处（缺一不可）──
 * 1. import 配置对象 → 追加进 componentConfList / componentConfGroup
 * 2. import Props 类型 → 追加进 ComponentPropsType 联合
 *
 * 只做 1：运行时能渲染，TS 对 props 无类型提示
 * 只做 2：TS 通过，运行时查表返回 undefined → 白屏
 */

import type { FC } from 'react';

// ── 运行时：题型注册配置（目录入口默认导出）──
import QuestionInputConf from './input';
import QuestionTitleConf from './title';

// ── 编译期：题型 Props 类型（type-only，编译后擦除）──
import type { QuestionInputPropsType } from './input';
import type { QuestionTitlePropsType } from './title';

/**
 * 所有题型 Props 的联合类型
 *
 * 语义：一个值只要完全符合其中某一种题型即合法
 *
 * 使用限制：
 * - 联合类型不能直接访问字段（TS 只允许访问所有成员共有的字段）
 * - 必须先按 type 收窄，或断言为具体题型类型后再访问
 *
 * 建议：给各题型 Props 加字面量 type 字段做成判别联合，
 * TS 可自动收窄，消除断言
 */
export type ComponentPropsType = Partial<QuestionInputPropsType> | Partial<QuestionTitlePropsType>;

/**
 * 题型注册配置的结构
 *
 * 每种题型目录的 index.ts 默认导出必须符合此形状，
 * 加了显式标注后写漏字段 TS 会当场报错
 *
 * - title       ：中文展示名，出现在左侧组件库卡片上
 * - type        ：题型唯一标识，序列化进数据库，上线后不可修改
 * - Component   ：画布渲染组件
 * - PropComponent：右侧属性配置表单
 * - defaultProps：新建组件时的初始配置
 */
export interface ComponentConfType<P = any> {
    title: string;
    type: string;
    Component: FC<Partial<P>>;
    PropComponent: FC<Partial<P>>;
    defaultProps: Partial<P>;
}

/**
 * 题型注册表（数组）
 *
 * - 顺序即左侧组件库的展示顺序
 * - 题型总量个位数，find 线性查找开销可忽略
 * - 若涨到几十个再改为 Map
 */
const componentConfList = [QuestionInputConf, QuestionTitleConf] as const;

/**
 * 分组后的题型列表，供 LeftPanel 按组渲染
 *
 * - groupId   ：分组唯一标识
 * - groupName ：分组显示名称
 * - components：该组下的题型配置数组
 */
export const componentConfGroup = [
    {
        groupId: 'textGroup',
        groupName: '文本显示',
        components: [QuestionTitleConf],
    },
    {
        groupId: 'inputGroup',
        groupName: '用户输入',
        components: [QuestionInputConf],
    },
];

/**
 * 按 type 查找题型配置
 *
 * @param type 题型标识（来自 ComponentInfoType.type）
 * @returns 配置对象，找不到返回 undefined
 *
 * 调用方必须处理 undefined：
 * - 后端返回了前端未实现的题型（版本不一致）
 * - 历史数据残留 / type 拼写错误
 *
 * 推荐：找不到时渲染兜底 UI，不要用非空断言 !
 */
export function getComponentConfByType(type: string): ComponentConfType | undefined {
    return componentConfList.find(c => c.type === type);
}
