/**
 * @description 问卷编辑页面
 *
 * ── 页面结构（经典三段式编辑器布局）──
 * ┌──────────────── Header（工具栏）────────────────┐
 * ├──────────────── MobileBar（仅窄屏）─────────────┤
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
 * - 作为「选中态的清空入口」：点击画布外围区域取消选中
 *
 * ── 路由 ──
 * 对应 /question/edit/:id，id 由 useLoadQuestionData 内部
 * 通过 useParams 读取，本组件不需要关心
 *
 * ── 响应式 ──
 * 布局的全部响应式行为（窄屏抽屉、纸面缩放）都在 index.module.scss
 * 里用媒体查询实现，本组件不判断视口宽度。
 * 唯一由 JS 承担的响应式是抽屉开关（若已接入），
 * 与布局样式是两套机制，改断点时要两边同步
 */

import type { FC } from 'react';

import { useDispatch } from 'react-redux';

// 切换选中项的 action：这里只用来「清空」选中
import { changeSelectedId } from '../../../store/componentsReducer';

// 问卷数据加载 Hook
// - 内部完成：读 id → 请求接口 → dispatch 写入 store
// - 返回 loading / error 供本组件做加载态与错误态处理
import useLoadQuestionData from '../../../hooks/useLoadQuestionData';

// CSS Modules：布局样式（含三档响应式，见文件内媒体查询）
import styles from './index.module.scss';

// 中央画布：渲染组件列表，并接收 loading 决定显示 Spin 还是内容
import EditCanvas from './EditCanvas';

const Edit: FC = () => {
    const dispatch = useDispatch();

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

    /**
     * 显式消费 error，避免 no-unused-vars 报错
     *
     * 说明：
     * - 错误态 UI 还没做，但 error 已经从 Hook 里解构出来了，
     *   void 只是告诉 ESLint「我知道它没用，是故意的」
     * - 没有运行时作用，接上 <Result> 分支后把这行删掉即可
     */
    void error;

    /**
     * 清空选中项
     *
     * 触发时机：点击画布外围（.main 的空白处）
     *
     * 为什么传空字符串而不是 null / undefined：
     * - store 里 selectedId 的类型是 string，'' 表示「没选任何东西」
     * - 下游判断统一是 fe_id === selectedId，
     *   所有 fe_id 都不可能是 ''，所以天然没有任何一项被高亮，
     *   不需要额外的判空分支
     *
     * 与 EditCanvas 的配合：
     * - EditCanvas 里 handleClick 调了 event.stopPropagation()，
     *   所以点击「组件外壳」时事件不会冒泡到这里，选中得以保留
     * - 只有点在组件之外的空白区域，才会走到这里被清空
     *   → 这正是「点空白取消选中」的预期行为
     */
    function clearSelectedId() {
        dispatch(changeSelectedId(''));
    }

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
     * 为什么放在 return 之前判断、且优先级最高：
     * - 请求失败时 loading 同样是 false，
     *   若不先拦错误，会直接掉进「空画布」分支
     */

    return (
        <div className={styles.container}>
            {/**
             * 顶部工具栏（占位）
             *
             * 目前只有一句内联样式写死白底 40px，用来把布局撑起来。
             * 后续应抽成 <EditHeader /> 组件，承载：
             * - 问卷标题（可就地编辑）
             * - 保存 / 发布按钮
             * - 返回、预览、历史记录等操作
             *
             * 注意：内联样式在 TSX 里能跑，但无法复用、无法加伪类与媒体查询，
             * 应移到 SCSS 的 .header 里（样式类已备好）
             *
             * 高度契约：这里的 40px 必须与 SCSS 里 $header-height 一致，
             * 否则纵向高度链会对不上（两者目前是两份真相，改一处要记得改另一处）
             */}
            <div style={{ backgroundColor: '#fff', height: '40px' }}>Header</div>

            {/**
             * 内容区外层包裹
             * - 负责「扣除 Header 高度后的剩余空间」：
             *   flex: auto 吃掉剩余高度，overflow: hidden 截住内部溢出
             * - 所以内部三栏才能各自独立滚动，而不带动整页滚动
             */}
            <div className={styles['content-wrapper']}>
                {/**
                 * 三栏主体：flex 横向排列
                 * - left  / right：固定宽度（285 / 300），且 flex-shrink: 0 不被压缩
                 * - main ：flex: 1 吃掉剩余空间，是唯一会伸缩的一栏
                 *
                 * 布局要点（已在 SCSS 中落实）：
                 * - 三栏都设了 overflow-y: auto，长内容在栏内滚动
                 * - main 上有 min-width: 0：
                 *   flex 子项默认 min-width: auto，内容过宽时会撑破布局不收缩
                 *
                 * 窄屏时这三栏会切换成「纸面独占 + 抽屉」，见 SCSS 媒体查询
                 */}
                <div className={styles.content}>
                    {/**
                     * 左栏：组件库
                     * TODO：替换为 <ComponentLib />，
                     * 从题型注册表读取全部题型，渲染可拖拽卡片
                     * 注意：窄屏下它会变成左侧抽屉，由 mobile-bar 的按钮唤出
                     */}
                    <div className={styles.left}>Left</div>

                    {/**
                     * 中栏：画布区 —— 同时也是「取消选中」的热区
                     *
                     * onClick 挂在 main 而不是 canvas 上：
                     * - main 是灰底留白区，包住整张纸，
                     *   点纸外任何地方都能取消选中，命中范围更大更好点
                     * - canvas-wrapper 有 overflow: auto，挂在它上面的话，
                     *   点滚动条、点纸边缘的空白都不好触发
                     *
                     * 注意事件流向：
                     * 点组件 → EditCanvas 的 handleClick 派发选中 + stopPropagation
                     *       → 事件到此为止，不会冒泡到 main，选中保留
                     * 点空白 → 没有组件拦它 → 冒泡到 main → clearSelectedId 清空
                     *
                     * ⚠️ 一个副作用：点击 canvas-wrapper 内部的滚动条或纸面留白
                     * 也会取消选中，因为它们在 main 的范围内且没有组件拦截
                     */}
                    <div className={styles.main} onClick={clearSelectedId}>
                        {/**
                         * 纸面容器
                         * - 负责「白色底 + 阴影 + 居中」，让画布像一张纸浮在灰底上
                         * - 本体是 absolute 居中 + 固定 400×580，
                         *   窄屏下由媒体查询改为自适应尺寸并逐级 scale
                         * - 它自己不处理点击，事件直接冒泡给 main
                         */}
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
                     * - 未选中时（selectedId 为 ''）显示「请选择一个组件」空状态，
                     *   这正是 clearSelectedId 之后面板该有的样子
                     * - 选中的 props 是联合类型，需按 type 收窄后再渲染表单
                     */}
                    <div className={styles.right}>Right</div>
                </div>
            </div>
        </div>
    );
};

export default Edit;
