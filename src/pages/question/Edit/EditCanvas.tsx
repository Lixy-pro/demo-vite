/**
 * @description 问卷编辑画布
 *
 * ── 职责 ──
 * 编辑器的中央区域，负责：
 * - 请求进行中显示 loading
 * - 请求完成后渲染问卷组件列表，并为每项套上「选中 / 悬停」外壳
 *
 * ── 当前状态：临时硬编码版（⚠️ 重要）──
 * 目前组件列表是写死的两道题，没有接 store。
 * 这是开发阶段的占位实现，用来先跑通布局与样式。
 *
 * 正式版应改为从 Redux 读取：
 *   const { componentList } = useSelector(getComponentList);
 *   {componentList.map(c => (
 *       <div className={styles['component-wrapper']} key={c.fe_id}
 *            onClick={() => selectComponent(c.fe_id)}>
 *           <div className={styles.component}>
 *               {renderComponent(c.type, c.props)}
 *           </div>
 *       </div>
 *   ))}
 *
 * 改造要点：
 * - key 必须用 c.fe_id，不能用 index（增删排序会错乱）
 * - 组件要按 c.type 从题型注册表查表取，不能一个个 import 写死
 * - props 要用 c.props，类型是联合类型，传给具体组件时需收窄或断言
 * - 选中态外壳（component-wrapper）负责高亮边框与删除按钮，
 *   点击时把 fe_id 写进 store.selectedId
 */

import type { FC } from 'react';
import { Spin } from 'antd';

// CSS Modules：局部作用域类名，避免样式污染
import styles from './EditCanvas.module.scss';

/**
 * 临时展示用的题型组件
 *
 * ⚠️ 注意这里 import 的是具体的 Component.tsx，
 * 而不是题型目录的入口文件（index.ts）。
 * - 目录入口导出的是 { title, type, Component, defaultProps } 配置对象
 * - 这里只需要渲染组件本身，所以直接引 Component
 * - 正式版改为查表渲染后，这两个 import 就可以删掉了
 */
import QuestionTitle from '../../../components/question/title/Component';
import QuestionInput from '../../../components/question/input/Component';

/**
 * 组件 props
 * - loading：问卷详情接口是否进行中
 *   由 useLoadQuestionData 返回，保证「数据没回来之前不渲染空画布」
 */
type PropsType = {
    loading: boolean;
};

/**
 * 编辑画布组件
 */
const EditCanvas: FC<PropsType> = ({ loading }) => {
    /**
     * 加载态
     *
     * 为什么在这里拦一道：
     * - 问卷数据在 useLoadQuestionData 里请求，loading 为 true 时
     *   store 里的 componentList 还是空的
     * - 若不加判断，会先闪一帧空白画布，再突然填充内容
     * - 居中 + 上边距只是简单占位，正式版可换成骨架屏（Skeleton）
     *   让布局高度与真实内容接近，避免加载完成时的跳动
     */
    if (loading) {
        return (
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Spin />
            </div>
        );
    }

    /**
     * 正常态：渲染组件列表
     *
     * 两层 div 的分工（这是有意为之，不是多余的嵌套）：
     * - 外层 component-wrapper：编辑器专属外壳
     *   负责选中高亮、悬停边框、右上角删除按钮等「编辑态装饰」
     * - 内层 component：题目本体
     *   保持纯净，同一份组件可直接复用到填写页，不带编辑器痕迹
     *
     * 这样分层的好处：
     * 给组件加编辑态功能时不用改组件本身，只改外壳
     */
    return (
        <div className={styles.canvas}>
            {/* 标题题：外层外壳 + 内层本体 */}
            <div className={styles['component-wrapper']}>
                <div className={styles.component}>
                    {/* 临时未传 props，组件内部用自己的默认值渲染；
                        正式版应传 {...c.props} */}
                    <QuestionTitle />
                </div>
            </div>

            {/* 输入框题：结构同上 */}
            <div className={styles['component-wrapper']}>
                <div className={styles.component}>
                    <QuestionInput />
                </div>
            </div>

            {/*
             * TODO：正式版在这里改为遍历 store.componentList
             * - 空列表时应渲染「空状态」提示（如「从左侧拖拽组件到这里」），
             *   否则画布一片空白，用户不知道怎么开始
             * - 后续接入拖拽排序（如 react-dnd）时，
             *   component-wrapper 就是拖拽句柄所在的那层
             */}
        </div>
    );
};

export default EditCanvas;
