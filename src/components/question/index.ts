/**
 * @description 题型体系的总出口：类型联合 + 运行时注册表
 *
 * ── 这个文件是干什么的 ──
 * 它同时承担「编译期」和「运行期」两件事，两者必须保持同步：
 *
 * ┌ 编译期：ComponentPropsType
 * │   把所有题型的 Props 收成联合类型，作为通用容器的 props 契约
 * └ 运行期：componentConfList + getComponentConfByType
 *    把所有题型的注册配置收成数组，供渲染时按 type 查表
 *
 * 编辑器渲染一个题型时，并不知道当前是输入框还是标题：
 * - 类型层面拿到的是宽泛的 ComponentPropsType
 * - 运行层面拿到的是 ComponentConfType，靠 type 查出真正的 Component
 *
 * ── 新增题型时要改这里（两处，缺一不可）──
 * 1. import 该题型的配置对象，追加进 componentConfList
 * 2. import 该题型的 Props 类型，追加进 ComponentPropsType
 *
 * 只做 1 不做 2：运行时能渲染，但 TS 对 props 一无所知
 * 只做 2 不做 1：TS 通过了，运行时查表返回 undefined，白屏
 *
 * ⚠️ 所以注释里原来的说法要修正：
 * 「全项目唯一需要手动登记」不准确——本文件自己就有两个登记点，
 * 且两者是同一种信息的两份表达，属于必须人工维持一致的地方。
 * 后续若题型继续增加，建议用构建脚本扫描目录自动生成这两段，
 * 彻底消除漏改风险。
 */

import type { FC } from 'react';

// ── 运行时：题型注册配置 ──
// 注意这里 import 的是目录入口（index.ts 的默认导出），
// 形状为 { title, type, Component, defaultProps }
import QuestionInputConf from './input';
import QuestionTitleConf from './title';

// ── 编译期：题型 Props 类型 ──
// type-only import，编译后会被完全擦除，不产生任何运行时代码

// 输入框题型 Props：{ title, placeholder }
import type { QuestionInputPropsType } from './input';

// 标题题型 Props：{ text, level, isCenter }
import type { QuestionTitlePropsType } from './title';

/**
 * 所有题型 Props 的联合类型
 *
 * 语义：
 * - 一个值只要「完全符合其中某一种题型」即合法
 * - 不是把所有字段 merge 在一起的大对象
 *   （那是交叉类型 &，会要求每个题型同时拥有全部字段，数据根本造不出来）
 *
 * ⚠️ 联合类型的使用限制（很重要）：
 *
 * 1) 不能直接访问字段
 *    props.title  // ❌ 报错
 *    // TS 只允许访问「所有成员都共有」的字段，而这里没有共有的
 *
 * 2) 必须先收窄再访问：
 *    a) 判别联合（推荐）：各题型 Props 带字面量 type 字段
 *       if (props.type === 'questionInput') { props.title }  // ✅
 *    b) 类型断言：(props as QuestionInputPropsType).title
 *
 * 3) 传给具体组件时通常要断言：
 *    <Component {...(props as QuestionInputPropsType)} />
 *
 * 建议：给各题型 Props 加 `type: 'questionInput'` 字面量字段，
 * 升级成真正的判别联合，TS 可自动收窄，不用再写断言。
 * 由于注册配置里已经有 type，这个字段的值与注册表的 type 应当一致。
 */
export type ComponentPropsType = QuestionInputPropsType | QuestionTitlePropsType;

/**
 * 题型注册配置的结构
 *
 * 每种题型目录（input/、title/）的 index.ts 默认导出都必须符合这个形状。
 * 加了显式类型标注后，某个题型写漏 defaultProps 或把 type 拼错，
 * TS 会在那个文件里当场报错，而不是等到运行时发现组件库少了一项。
 *
 * 字段说明：
 * - title      ：中文展示名，出现在左侧组件库卡片上
 * - type       ：题型唯一标识，会被序列化存进数据库。
 *                ⚠️ 上线后不可修改，改了历史问卷会查不到组件
 * - Component  ：真正的渲染组件。
 *                这里用 Partial<ComponentPropsType> 是为了兼容
 *                「联合类型 props 直接透传」的场景，调用方通常仍需断言成具体类型
 * - defaultProps：新建该题型时的初始配置，来自该题型的 interface.ts
 *
 * 关于 defaultProps 的类型：
 * - 用 Partial 是因为默认值允许只写一部分字段
 * - 但注意：这里的 Partial 会让「漏写必填字段」不被发现，
 *   如果希望默认值必须写全，可改成该题型的完整 Props 类型
 */
export type ComponentConfType = {
    title: string;
    type: string;
    Component: FC<Partial<ComponentPropsType>>;
    defaultProps: Partial<ComponentPropsType>;
};

/**
 * 题型注册表
 *
 * 用数组而不是 Map：
 * - 题型总量是个位数，find 的线性查找开销可忽略
 * - 数组字面量更直观，新增题型只需在末尾追加一项
 * - 若题型涨到几十个，再改成 Map 预构建：
 *   new Map(componentConfList.map(c => [c.type, c]))
 *
 * ⚠️ 顺序即组件库展示顺序：
 * 这里的前后顺序直接决定左侧面板里题型的排列，
 * 想调整顺序改这里即可，不用动别的的文件
 */
const componentConfList: ComponentConfType[] = [QuestionInputConf, QuestionTitleConf];

/**
 * 按 type 查找题型配置
 *
 * @param type 题型标识（来自 ComponentInfoType.type）
 * @returns 找到则返回配置对象，找不到返回 undefined
 *
 * 调用方必须处理 undefined 分支，两种典型情况：
 * - 后端返回了前端尚未实现的题型（版本不一致）
 * - type 拼写错误或历史数据残留
 *
 * 推荐用法：
 * const conf = getComponentConfByType(c.type);
 * if (!conf) return <div>未知题型：{c.type}</div>;   // 兜底，别直接渲染
 * const { Component } = conf;
 *
 * ⚠️ 不要写成 getComponentConfByType(c.type)!：
 * 非空断言会把「未知题型」这个真实存在的运行时问题
 * 变成一句难查的 "Cannot read properties of undefined"
 */
export function getComponentConfByType(type: string): ComponentConfType {
    return componentConfList.find(c => c.type === type);
}

/**
 * 补充建议：可再导出一个「全量列表」供组件库使用
 * export function getComponentConfList() {
 *     return componentConfList;
 * }
 * 避免外部直接 import 这个私有数组，保持「通过函数访问」的一致性，
 * 将来要加排序、过滤、权限控制时只改这一处
 */
