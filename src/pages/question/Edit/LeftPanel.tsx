/**
 * @description 编辑器左栏面板
 *
 * 承载编辑页左侧的所有辅助功能，当前以 Tabs 切换两个视图：
 * - 组件库：展示所有可拖拽的题型卡片，供用户往画布中添加
 * - 图层  ：展示画布中组件的层级列表（TODO：待实现）
 *
 * 布局说明：
 * - 宽度由父容器 .left 的 CSS Modules 控制（固定 285px，flex-shrink: 0）
 * - 窄屏下 .left 会切换为左侧抽屉，由 mobile-bar 的按钮唤出
 * - 本组件不关心响应式，只负责渲染内容区
 */

import type { FC } from 'react';

import { AndroidOutlined, AppleOutlined } from '@ant-design/icons';
import { Tabs } from 'antd';

// 组件库 Tab 的内容区：从题型注册表读取全部题型，渲染可拖拽卡片
import ComponentLib from './ComponentLib';

const LeftPanel: FC = () => {
    /**
     * Tabs 配置项
     *
     * - key        ：Tab 唯一标识，用于 defaultActiveKey 指定默认激活项
     * - label      ：Tab 标题文案
     * - icon       ：Tab 标题前缀图标
     * - children   ：Tab 对应的内容面板
     *
     * 当前两个 Tab：
     * 1. componentLib —— 组件库（默认激活）
     * 2. layers       —— 图层列表（占位，后续实现组件树 / 大纲视图）
     */
    const tabsItems = [
        {
            key: 'componentLib',
            label: '组件库',
            children: <ComponentLib />,
            icon: <AndroidOutlined />,
        },
        {
            key: 'layers',
            label: '图层',
            children: <div>图层</div>,
            icon: <AppleOutlined />,
        },
    ];

    return <Tabs defaultActiveKey="componentLib" items={tabsItems} />;
};

export default LeftPanel;
