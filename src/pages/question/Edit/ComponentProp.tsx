/**
 * @description 组件属性配置面板
 *
 * 右侧属性 Tab 的内容区：
 * - 从 store 读取当前选中的组件
 * - 根据组件 type 从题型注册表查出对应的 PropComponent（配置表单）
 * - 将组件的 props 传入表单，用户修改后通过 onChange 回写 store
 *
 * 空状态：
 * - 未选中任何组件（selectedId 为 ''）时渲染 <NoProp /> 提示
 * - 选中了但 type 在注册表里找不到时同样走空状态（兜底防御）
 */

import type { FC } from 'react';
import { useDispatch } from 'react-redux';

import { getComponentConfByType } from '../../../components/question';
import type { ComponentPropsType } from '../../../components/question';

import useGetComponentInfo from '../../../hooks/useGetComponentInfo';
import { changeComponentProps } from '../../../store/componentsReducer';

/**
 * 空状态占位
 *
 * 触发条件：
 * - 页面刚加载、尚未选中任何组件
 * - 清空选中态后（点击画布空白）
 * - 选中了一个前端未实现的题型（type 不在注册表中）
 */
const NoProp: FC = () => {
    return <div style={{ textAlign: 'center' }}>未选中组件</div>;
};

/**
 * 属性配置面板本体
 *
 * 数据流：
 * store.selectedId → useGetComponentInfo → selectedComponent
 *   → getComponentConfByType(type) 拿到 PropComponent
 *   → <PropComponent {...props} onChange={changeProps} />
 *   → 用户修改 → changeProps → dispatch(changeComponentProps) → store 更新
 */
const Prop: FC = () => {
    const dispatch = useDispatch();

    /**
     * 当前选中的组件完整信息
     *
     * selectedComponent 为 null 表示「没有选中任何组件」
     * （selectedId 为 '' 时 hook 返回 null）
     */
    const { selectedComponent } = useGetComponentInfo();
    if (selectedComponent == null) return <NoProp />;

    const { type, props } = selectedComponent;

    /**
     * 从题型注册表查配置
     *
     * 查不到的情况：后端返回了一个前端未实现的题型
     * 此时走空状态兜底，避免渲染崩溃
     */
    const componentConf = getComponentConfByType(type);
    if (componentConf == null) return <NoProp />;

    /**
     * 属性变更回调
     *
     * 由 PropComponent 在用户操作（输入、切换、拖拽等）时调用，
     * 将新的 props 浅合并后写入 store
     *
     * @param newProps 用户修改产生的部分或全部 props
     */
    function changeProps(newProps: ComponentPropsType) {
        if (!selectedComponent) return;
        const { fe_id } = selectedComponent;
        dispatch(changeComponentProps({ fe_id, newProps }));
    }

    // 解构出该题型对应的配置表单组件
    const { PropComponent } = componentConf;

    /**
     * 渲染配置表单
     *
     * - props      ：当前组件的完整配置，作为表单初始值
     * - onChange   ：表单值变化时回调，回写 store
     *
     * 注意：PropComponent 的 onChange 签名是 (newProps: Partial<PropsType>) => void，
     * 这里统一用 ComponentPropsType（联合类型）传参，
     * 各题型 PropComponent 内部会按自身 type 收窄
     */
    return <PropComponent {...props} onChange={changeProps} />;
};

export default Prop;
