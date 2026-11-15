/**
 * @description 编辑器右栏面板
 *
 * 承载编辑页右侧的所有辅助功能，当前以 Tabs 切换两个视图：
 * - 属性    ：展示当前选中组件的配置表单，供用户修改 props
 * - 页面设置：问卷级别的全局配置（TODO：待实现）
 *
 * 布局说明：
 * - 宽度由父容器 .right 的 CSS Modules 控制（固定 300px，flex-shrink: 0）
 * - 窄屏下 .right 会切换为右侧抽屉，由 mobile-bar 的按钮唤出
 * - 本组件不关心响应式，只负责渲染内容区
 */

import type { FC } from 'react';

import { FileTextOutlined, SettingOutlined } from '@ant-design/icons';
import { Tabs } from 'antd';

// 属性 Tab 的内容区：按 store.selectedId 找到当前组件，渲染对应题型的配置表单
import ComponentProp from './ComponentProp';

const RightPanel: FC = () => {
    /**
     * Tabs 配置项
     *
     * - key      ：Tab 唯一标识，用于 defaultActiveKey 指定默认激活项
     * - label    ：Tab 标题文案
     * - icon     ：Tab 标题前缀图标
     * - children ：Tab 对应的内容面板
     *
     * 当前两个 Tab：
     * 1. prop    —— 组件属性（默认激活，未选中时显示空状态）
     * 2. setting —— 页面设置（占位，后续实现问卷标题、描述、提交按钮文案等全局配置）
     */
    const tabsItems = [
        {
            key: 'prop',
            label: '属性',
            children: <ComponentProp />,
            icon: <FileTextOutlined />,
        },
        {
            key: 'setting',
            label: '页面设置',
            children: <div>页面设置</div>,
            icon: <SettingOutlined />,
        },
    ];

    return <Tabs defaultActiveKey="prop" items={tabsItems} />;
};

export default RightPanel;
