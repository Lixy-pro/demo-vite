/**
 * @description 组件库面板
 *
 * 从题型注册表（componentConfGroup）读取所有已注册的题型配置，
 * 按分组渲染可点击添加的组件卡片。
 *
 * 交互：
 * - 点击卡片 → 调用 addComponent 往画布追加一个新组件
 *   - fe_id 由 nanoid 前端生成，保证唯一且稳定
 *   - props 取该题型的 defaultProps 作为初始值
 *   - 新增后自动选中该组件（由 reducer 内部处理）
 *
 * 布局：
 * - 外层由 LeftPanel 的 Tabs 承载，本组件只负责列表渲染
 * - 分组标题 + 卡片网格，样式由 CSS Modules 控制
 */

import type { FC } from 'react';
import { Typography } from 'antd';
import { useDispatch } from 'react-redux';
import { nanoid } from '@reduxjs/toolkit';

import type { ComponentConfType } from '../../../components/question';
import { componentConfGroup } from '../../../components/question';
import { addComponent } from '../../../store/componentsReducer';

import styles from './ComponentLib.module.scss';

const { Title } = Typography;

/**
 * 单个组件卡片
 *
 * 展示题型的最小预览（用该题型自己的渲染组件 + defaultProps），
 * 点击后往画布追加一个同类型的新组件实例
 */
const GenComponent: FC<{ c: ComponentConfType }> = ({ c }) => {
    const { title, type, Component, defaultProps } = c;
    const dispatch = useDispatch();

    /**
     * 点击添加组件到画布
     *
     * 每个新实例都生成独立的 fe_id，
     * 即使同一题型添加多次也不会冲突
     */
    function handleClick() {
        dispatch(
            addComponent({
                fe_id: nanoid(),
                title,
                type,
                props: defaultProps,
            })
        );
    }

    return (
        <div className={styles.wrapper} onClick={handleClick}>
            <div className={styles.component}>
                <Component />
            </div>
        </div>
    );
};

/**
 * 组件库列表（按分组渲染）
 *
 * componentConfGroup 的结构：
 * - groupId   ：分组唯一标识
 * - groupName ：分组显示名称（如「文本」「业务」）
 * - components：该分组下的题型配置数组
 *
 * 第一个分组上方无间距，后续分组通过 marginTop 拉开间距
 */
const Lib: FC = () => {
    return (
        <>
            {componentConfGroup.map((group, index) => {
                const { groupId, groupName, components } = group;
                return (
                    <div key={groupId}>
                        <Title
                            level={3}
                            style={{
                                fontSize: '16px',
                                marginTop: index > 0 ? '20px' : '0',
                            }}
                        >
                            {groupName}
                        </Title>
                        <div>
                            {components.map(c => (
                                <GenComponent key={c.type} c={c} />
                            ))}
                        </div>
                    </div>
                );
            })}
        </>
    );
};

export default Lib;
