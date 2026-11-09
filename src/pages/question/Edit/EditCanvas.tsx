/**
 * @description 问卷编辑画布
 *
 * ── 职责 ──
 * 编辑器的中央区域，负责：
 * - 请求进行中显示 loading
 * - 请求完成后按 componentList 顺序渲染各题型组件，
 *   每项套一层「编辑态外壳」（选中高亮 / 悬停 / 删除按钮的挂载点）
 *
 * ── 数据来源 ──
 * 组件列表来自 Redux（useGetComponentInfo），
 * 本组件不自己发请求、不自己维护状态，只做展示。
 * 数据由 Edit 页面的 useLoadQuestionData 拉回并写入 store。
 *
 * ── 渲染链路 ──
 * componentList → 逐项 getComponent(c) 查表
 *              → getComponentConfByType(c.type) 取到 Component
 *              → <Component {...c.props} />
 */

import type { FC } from 'react';
import { Spin } from 'antd';

// CSS Modules：局部作用域类名，避免样式污染
import styles from './EditCanvas.module.scss';

// 组件列表：已封装好兜底逻辑，返回 { componentList }
import useGetComponentInfo from '../../../hooks/useGetComponentInfo';

// 题型注册表：按 type 查配置（含 Component 与 defaultProps）
import { getComponentConfByType } from '../../../components/question';

// 单个组件在画布上的数据结构
import type { ComponentInfoType } from '../../../store/componentsReducer';

/**
 * 组件 props
 * - loading：问卷详情接口是否进行中
 *   由父页面传入，保证「数据没回来之前不渲染空画布」
 */
type PropsType = {
    loading: boolean;
};

/**
 * 按组件信息渲染对应题型组件
 *
 * @param componentInfo 单个组件配置（含 type 与 props）
 * @returns 对应的题型组件；type 查不到时返回 null
 *
 * 为什么要这一层函数：
 * - componentList 里存的是「数据」，type 是字符串，
 *   必须查表才能拿到真正的 React 组件
 * - 把查表 + 兜底收在这里，JSX 里就只剩一行 getComponent(c)，
 *   渲染逻辑保持干净
 *
 * ⚠️ 关于 props 的类型：
 * - c.props 是联合类型（输入框 | 标题），
 *   而 Component 要的是具体类型的 props
 * - 这里之所以没报 TS 错误，是因为 ComponentConfType 把
 *   Component 标成了 FC<Partial<ComponentPropsType>>，相当于放宽了约束
 * - 代价是失去精确校验：给标题题传了 placeholder 也不会被拦。
 *   要严格起来，得把注册表升级成判别联合 + 泛型约束
 */
function getComponent(componentInfo: ComponentInfoType) {
    const { type, props } = componentInfo;

    // 按 type 查注册表
    // - undefined 是真实可能发生的情况：
    //   后端返回了前端尚未实现的题型、或历史数据残留了已下线的 type
    const componentConf = getComponentConfByType(type);

    if (componentConf == undefined) return null;

    const { Component } = componentConf;

    // 透传该题目的配置
    return <Component {...props} />;
}

/**
 * 编辑画布组件
 */
const EditCanvas: FC<PropsType> = ({ loading }) => {
    const { componentList } = useGetComponentInfo();

    /**
     * 加载态
     *
     * 为什么在这里拦一道：
     * - 数据由父页面异步请求，loading 为 true 时 store 里还是空列表
     * - 若不加判断，会先闪一帧空白画布，再突然填充内容
     * - 这里用简单居中占位；若想避免加载完成时的高度跳动，
     *   可换成 Skeleton，让占位高度接近真实纸面
     */
    if (loading) {
        // 用 paddingTop 百分比而非固定 px：
        // 纸面在窄屏会缩放，固定 24px 会顶偏，百分比能跟着容器走
        return (
            <div style={{ textAlign: 'center', paddingTop: '24%' }}>
                <Spin />
            </div>
        );
    }

    /**
     * 正常态：渲染组件列表
     *
     * 两层 div 的分工（有意为之，不是多余嵌套）：
     * - 外层 component-wrapper：编辑器专属外壳
     *   负责选中高亮、悬停边框、删除按钮等「编辑态装饰」
     * - 内层 component：题目本体
     *   保持纯净，同一份组件可直接复用到填写页，不带编辑器痕迹
     *
     * 好处：加编辑态功能时只改外壳，不动组件本身
     */
    return (
        <div className={styles.canvas}>
            {componentList.map(c => {
                // ⚠️ key 必须用 fe_id，不能用数组下标：
                // 列表会增删、拖拽排序，下标会变，
                // 用下标会导致 React 复用错实例（输入框内容串位）
                const { fe_id } = c;

                return (
                    <div key={fe_id} className={styles['component-wrapper']}>
                        <div className={styles.component}>{getComponent(c)}</div>
                    </div>
                );
            })}

            {/**
             * 空状态：列表为空时给个指引，否则画布一片空白，
             * 新用户不知道要从左侧拖组件过来
             *
             * {componentList.length === 0 && (
             *     <Empty description="从左侧选择组件添加到问卷" />
             * )}
             *
             * TODO：
             * - 接入点击选中：外壳加 onClick 把 fe_id 写进 store.selectedId，
             *   并拼接 styles.selected 类名做高亮（样式已备好）
             * - 接入拖拽排序（react-dnd）：component-wrapper 即拖拽句柄所在层
             * - 查不到题型时（getComponent 返回 null）目前渲染空外壳，
             *   可改成显示「未知题型」占位，避免看起来像渲染失败
             */}
        </div>
    );
};

export default EditCanvas;
