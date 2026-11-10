/**
 * 自定义 Hook：加载问卷详情数据并同步到 Redux
 *
 * ── 职责 ──
 * 1) 从路由参数中取出问卷 id
 * 2) 调用接口拉取问卷详情（标题 + 组件列表）
 * 3) 把 componentList 写入 Redux，供画布 / 属性面板消费
 * 4) 对外暴露 loading / error，交给页面做加载态与错误提示
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
 * @returns { loading, error } 请求进行中与错误信息
 */

import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useRequest } from 'ahooks';

import { getQuestionService } from '../services/question';
import { resetComponents } from '../store/componentsReducer';

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
     * 为什么手动 throw：
     * - id 为空属于「不该发生」的情况，说明路由配置或调用方式有问题
     * - 直接抛错让错误进入 useRequest 的 error，
     *   而不是拿空 id 去打接口、拿到一个莫名其妙的 200 或 404
     *
     * 注意返回类型：
     * - 这里没有显式标注返回值，TS 会按 getQuestionService 的返回推断
     * - 若 data 的类型推断不理想（比如被推成 unknown），
     *   可在 service 层给 getQuestionService 补上返回类型，比在这里补更根本
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
     * - loading：请求进行中，页面用它显示加载态 / 骨架屏
     * - run    ：手动触发请求的方法（ahooks 保证引用稳定）
     * - data   ：接口返回数据，默认 {} 避免调用方解构报错
     * - error  ：错误信息，无错误时为 undefined
     *
     * ⚠️ 关于 `data = {}` 这个默认值：
     * - 它让 data 永远不会是 undefined，所以下面的 `if (!data)` 实际不会命中
     * - 这是「防御性但无效」的判断：不会造成 bug，
     *   但也别指望靠它拦截失败请求 —— 请求失败时 data 同样是默认 {}，
     *   依然会往下走，真正拦失败的是下面的 `if (error) return`
     * - 副作用：默认值 {} 与「接口真返回了空对象」无法区分，
     *   请求尚未完成的状态被抹平了一层
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
     */
    useEffect(() => {
        // 加载中 → 等它完成，不写入半截数据
        if (loading || !data) return;

        // 请求失败 → 不清空已有画布，
        // 让用户报错时仍能看到原来的问卷，而不是一片空白
        if (error) return;

        const { title = '', componentList = [] } = data;

        /**
         * 默认选中第一道题
         * - 问卷加载完就选中第一项，右侧属性面板立刻有内容，
         *   用户不必先点一下才能开始编辑
         * - 列表为空时保持 ''，属性面板应渲染「请选择一个组件」的空状态
         * - ⚠️ 注意：这是前端编辑态的临时状态，不是后端字段，
         *   后端并不存储「当前选中哪个」
         */
        let selectedId = '';
        if (componentList.length > 0) {
            selectedId = componentList[0].fe_id;
        }

        /**
         * 用接口数据重置画布组件
         *
         * 入参形状：{ componentList, selectedId }
         * - 整体作为 ComponentsStateType 交给 reducer，
         *   所以 reducer 必须能同时处理这两个字段
         * - ⚠️ 若 reducer 写的是 `return action.payload` 整包透传，
         *   接口返回的其他字段（如 title、isDeleted）也会进 store；
         *   建议在 reducer 里显式挑字段
         *
         * 用 reset 而非 merge：
         * 切换问卷时必须整体替换，否则上一份问卷的组件会残留
         */
        dispatch(resetComponents({ componentList, selectedId }));

        /**
         * title 目前未消费
         * - 保留解构是为了记住这个字段存在，后续同步到 store 时
         *   （供 Header 显示问卷标题）不用再翻接口文档
         * - void 只是为了避开 ESLint 的 no-unused-vars 报错，
         *   没有运行时作用
         * - 真正接上 store 后，把 void 这行删掉即可
         */
        void title;
    }, [loading, data, error, dispatch]);

    /**
     * 发起请求
     *
     * 首次进入页面的执行顺序：
     * 1) 组件挂载，本 effect 调用 run()，请求发出，此时 data 仍是默认 {}
     * 2) 另一个 effect 先跑一次：
     *    - loading 为 true，被第一行拦下
     *    - 若此刻已非 loading，data 也是空 {}，dispatch 一个空列表
     * 3) 请求返回 → data 更新 → effect 再跑一次，写入真实数据
     *
     * 也就是说第 2 步「dispatch 空列表」这一帧是可能存在的，
     * 所以画布必须先按 loading 渲染，避免闪一下空白
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
     * - 问卷数据统一从 Redux 读取，避免「同一份数据两个来源」不同步
     * - 页面只需关心「加载中吗 / 出错了吗」
     */
    return { loading, error };
}

export default useLoadQuestionData;
