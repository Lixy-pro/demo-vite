/**
 * @description 问卷编辑页面
 *
 * ── 页面结构（经典三段式编辑器布局）──
 * ┌──────────────── Header（工具栏）────────────────┐
 * ├────────┬──────────────────────┬────────────────┤
 * │ Left   │      main            │ Right          │
 * │ 组件库  │   canvas-wrapper     │ 属性面板        │
 * │        │    └─ EditCanvas     │                │
 * └────────┴──────────────────────┴────────────────┘
 *
 * ── 职责 ──
 * - 作为「数据入口」：在这里调用 useLoadQuestionData 拉问卷详情，
 *   数据自动写入 Redux，下游组件（画布 / 属性面板）直接从 store 读，
 *   不需要 props 层层传递
 * - 作为「布局容器」：只负责骨架和区域划分，
 *   各区域的具体内容交给子组件，避免本文件膨胀
 *
 * ── 路由 ──
 * 对应 /question/edit/:id，id 由 useLoadQuestionData 内部
 * 通过 useParams 读取，本组件不需要关心
 */

import type { FC } from 'react';

// 问卷数据加载 Hook
// - 内部完成：读 id → 请求接口 → dispatch 写入 store
// - 返回 loading / error 供本组件做加载态与错误态处理
import useLoadQuestionData from '../../../hooks/useLoadQuestionData';

// CSS Modules：布局样式
import styles from './index.module.scss';

// 中央画布：渲染组件列表，并接收 loading 决定显示 Spin 还是内容
import EditCanvas from './EditCanvas';

const Edit: FC = () => {
    /**
     * 加载问卷数据
     *
     * 副作用说明：
     * - 这个 Hook 一调用就会触发请求（内部 useEffect + run）
     * - 数据不通过返回值往下传，而是写进 Redux，
     *   所以这里只取 loading / error 两个「状态」
     *
     * ⚠️ error 目前取了但没用：
     * - 请求失败时 loading 会变 false，画布会渲染成「空列表」，
     *   用户看到的是一片空白，完全不知道出错了
     * - 建议补一个错误态分支（见下方 TODO）
     */
    const { loading, error } = useLoadQuestionData();

    void error;

    /**
     * TODO：错误态优先处理
     *
     * if (error) {
     *     return (
     *         <div className={styles.container}>
     *             <Result
     *                 status="error"
     *                 title="加载问卷失败"
     *                 subTitle={error.message || '请检查网络后重试'}
     *                 extra={<Button onClick={() => location.reload()}>重新加载</Button>}
     *             />
     *         </div>
     *     );
     * }
     *
     * 为什么放在 loading 之前判断：
     * - 请求失败时 loading 同样是 false，
     *   若不先拦错误，会直接掉进「空画布」分支
     */

    return (
        <div className={styles.container}>
            {/**
             * 顶部工具栏（占位）
             *
             * 当前用内联样式写死白底 40px，只是为了先把布局撑起来。
             * 后续应抽成 <EditHeader /> 组件，承载：
             * - 问卷标题（可就地编辑）
             * - 保存 / 发布按钮
             * - 返回、预览、历史记录等操作
             *
             * 注意：内联样式在 TSX 里能跑，但无法复用、无法加伪类与媒体查询，
             * 正式版应移到 SCSS 里
             */}
            <div style={{ backgroundColor: '#fff', height: '40px' }}>Header</div>

            {/**
             * 内容区外层包裹
             * - 通常负责「扣除 Header 高度后的剩余空间」计算，
             *   让内部三栏能各自独立滚动
             * - 常见写法：height: calc(100vh - 40px)
             */}
            <div className={styles['content-wrapper']}>
                {/**
                 * 三栏主体：flex 横向排列
                 * - left  / right：固定宽度，一般不随窗口变化
                 * - main ：flex: 1 吃掉剩余空间，是唯一会伸缩的一栏
                 *
                 * 布局要点：
                 * - 三栏都要设 overflow: auto（或 hidden），
                 *   否则内部长内容会把整页撑开，外层滚动条失控
                 * - min-width: 0 常加在 main 上：
                 *   flex 子项默认 min-width: auto，内容过宽时会撑破布局不收缩
                 */}
                <div className={styles.content}>
                    {/**
                     * 左栏：组件库
                     * TODO：替换为 <ComponentLib />，
                     * 从题型注册表读取全部题型，渲染可拖拽卡片
                     */}
                    <div className={styles.left}>Left</div>

                    {/**
                     * 中栏：画布区
                     * - main 负责「居中 + 内边距」，营造纸张感
                     * - canvas-wrapper 负责「给画布套一层背景与阴影」，
                     *   让白色画布和灰色外围区分开
                     *
                     * 分两层的原因：
                     * main 管定位与留白，wrapper 管视觉外观，
                     * 画布组件本身保持干净、可复用到其他页面
                     */}
                    <div className={styles.main}>
                        <div className={styles['canvas-wrapper']}>
                            {/*
                             * 把 loading 透传给画布：
                             * - 由 EditCanvas 内部决定显示 Spin 还是组件列表
                             * - 本页面不直接判断 loading，保持「状态在父、展示在子」的分工
                             *
                             * 为什么不在这里用三元换成 <Spin />：
                             * 那样画布 DOM 会被卸载再挂载，
                             * 内部状态（滚动位置、临时输入）会丢失
                             */}
                            <EditCanvas loading={loading} />
                        </div>
                    </div>

                    {/**
                     * 右栏：属性面板
                     * TODO：替换为 <PropsComponent />，
                     * 按 store.selectedId 找到当前组件，渲染对应题型的配置表单
                     * - 未选中时显示「请选择一个组件」的空状态
                     * - 选中的 props 是联合类型，需按 type 收窄后再渲染表单
                     */}
                    <div className={styles.right}>Right</div>
                </div>
            </div>
        </div>
    );
};

export default Edit;
