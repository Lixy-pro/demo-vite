import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useRequest } from 'ahooks';

import { getQuestionService } from '../services/question';
import { resetComponents } from '../store/componentsReducer';

/**
 * 自定义 Hook：加载问卷详情数据并同步到 Redux
 *
 * ── 职责 ──
 * 1) 从路由参数中取出问卷 id
 * 2) 调用接口拉取问卷详情（标题 + 组件列表）
 * 3) 把 componentList 写入 Redux，供画布 / 属性面板消费
 * 4) 对外暴露 loading / error，交给页面做骨架屏与错误提示
 *
 * ── 数据流 ──
 * URL(/question/edit/:id)
 *   → useParams 拿到 id
 *   → effect 触发 run()
 *   → getQuestionService(id) 返回问卷数据
 *   → 存入 useRequest 的 data
 *   → 另一个 effect 监听 data，dispatch 进 Redux
 *
 * ── 设计要点 ──
 * 请求与「写入 store」拆成两个 effect：
 * - 一个只负责「什么时候发请求」（依赖 id）
 * - 一个只负责「数据到了怎么办」（依赖 data）
 * 职责单一，后续要加缓存 / 预取时只需改其中一处
 *
 * @returns { loading, error }
 */
function useLoadQuestionData() {
    const dispatch = useDispatch();

    /**
     * 路由参数中的问卷 id
     * - 路由定义为 /question/edit/:id，正常进入一定有值
     * - 默认值 '' 只是为了类型上是 string，避免后续判空时写可选链
     * - id 变化（如在同一组件内切换问卷）会触发重新请求
     */
    const { id = '' } = useParams();

    /**
     * 实际的请求函数
     *
     * 为什么要手动 throw：
     * - id 为空属于「不该发生」的情况，说明路由配置或调用方式有问题
     * - 直接抛错让错误进入 useRequest 的 error，
     *   而不是拿空 id 去打接口、拿到一个莫名其妙的 200 或 404
     */
    async function load() {
        if (!id) throw new Error('没有问卷ID');
        const data = await getQuestionService(id);
        return data;
    }

    /**
     * 问卷详情请求（手动触发）
     *
     * manual: true 的原因：
     * - 需要等 id 就绪后再请求，且希望 id 变化时重新请求
     * - 交给 useEffect 控制比依赖 useRequest 的默认挂载时机更可控
     *
     * 解构说明：
     * - loading：请求进行中，页面用它显示 loading / 骨架屏
     * - run    ：手动触发请求的方法（ahooks 保证引用稳定）
     * - data   ：接口返回数据，默认 {} 避免调用方解构报错
     * - error  ：错误信息，无错误时为 undefined
     */
    const {
        loading,
        run,
        data = {},
        error,
    } = useRequest(load, {
        manual: true,
    });

    /**
     * 数据到达后，同步到 Redux
     *
     * 触发时机：
     * - 请求成功，data 被赋值为新对象 → 执行
     * - 组件重渲染但 data 引用未变 → 不执行（ahooks 返回的是同一份引用）
     *
     * 注意这里的判空条件：
     * - 由于上面给了默认值 `data = {}`，data 永远不会是 undefined
     * - 所以 `if (!data)` 实际上永远不会命中，属于「防御性但无效」的判断
     * - 它不会造成 bug，但别指望靠它拦截失败请求：
     *   请求失败时 data 同样会保持为默认 {}，依然会走进来
     *
     * 兜底策略：
     * - title / componentList 都给了默认值
     * - 后端字段缺失时不会渲染出 undefined，画布直接是空的
     */
    useEffect(() => {
        if (loading || !data) return; // 加载中 / 没数据 → 不处理
        if (error) return; // 请求失败 → 不清空已有画布

        const { title = '', componentList = [] } = data;

        // 用接口数据重置画布组件
        // 「reset」而非「merge」：切换问卷时必须整体替换，
        // 否则上一份问卷的组件会残留到新问卷里
        dispatch(resetComponents({ componentList }));

        // title 目前未使用，保留解构是为了后续同步到 store
        void title;
    }, [loading, data, error, dispatch]);

    /**
     * 发起请求
     *
     * 执行顺序说明（首次进入页面）：
     * 1) 组件挂载，两个 effect 都会在渲染后执行
     * 2) 本 effect 调用 run()，请求发出，此时 data 仍是默认 {}
     * 3) 另一个 effect 先跑一次，但数据是空的，dispatch 一个空列表
     * 4) 请求返回 → data 更新 → 另一个 effect 再跑一次，写入真实数据
     *
     * 也就是说「dispatch 空组件列表」这一帧是存在的，
     * 画布应先按 loading 渲染，避免闪一下空白画布
     *
     * 依赖说明：
     * - id ：切换问卷时重新请求
     * - run：ahooks 保证引用稳定，放进依赖无害
     */
    useEffect(() => {
        run();
    }, [id, run]);

    /**
     * 只暴露请求状态，不暴露 data
     * - 问卷数据统一从 Redux 读取，避免「同一份数据两个来源」
     * - 页面只需关心「加载中吗 / 出错了吗」
     */
    return { loading, error };
}

export default useLoadQuestionData;
