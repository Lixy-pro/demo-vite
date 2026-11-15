/**
 * @description 加载问卷详情数据并同步到 Redux
 *
 * ── 职责 ──
 * 1. 从路由参数取问卷 id
 * 2. 调用接口拉取问卷详情
 * 3. 把 componentList + selectedId 写入 Redux，供画布 / 属性面板消费
 * 4. 对外暴露 loading / error，交给页面做加载态与错误提示
 *
 * ── 数据流 ──
 * URL(/question/edit/:id)
 *   → useParams 取 id
 *   → useEffect 触发 run()
 *   → getQuestionService(id) 返回问卷数据
 *   → 另一个 useEffect 监听 data，dispatch resetComponents 进 Redux
 *
 * ── 设计要点 ──
 * 请求与「写入 store」拆成两个 effect：
 * - 一个只负责「什么时候发请求」（依赖 id）
 * - 一个只负责「数据到了怎么办」（依赖 data）
 * 职责单一，后续加缓存 / 预取只需改其中一处
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
     *
     * 路由定义为 /question/edit/:id，正常进入一定有值
     * 默认值 '' 只为让类型是 string，避免后续写可选链
     * id 变化（同一组件内切换问卷）会触发重新请求
     */
    const { id = '' } = useParams();

    /**
     * 实际的请求函数
     *
     * id 为空时直接 throw：
     * - 属于「不该发生」的情况（路由配置或调用方式有问题）
     * - 抛错让错误进入 useRequest 的 error，
     *   而不是拿空 id 去打接口拿到莫名其妙的响应
     */
    async function load() {
        if (!id) throw new Error('没有问卷ID');
        const data = await getQuestionService(id);
        return data;
    }

    /**
     * 问卷详情请求（手动触发）
     *
     * manual: true —— 等 id 就绪后由 useEffect 控制发请求，
     * 比依赖 useRequest 默认挂载时机更可控，id 变化时也能重新请求
     *
     * data = {} 兜底：
     * - 让 data 永远不为 undefined，下游解构不报错
     * - ⚠️ 副作用：请求失败时 data 也是 {}，
     *   `if (!data)` 拦不住失败，真正拦失败靠下面的 `if (error) return`
     * - 默认值 {} 与「接口真返回空对象」无法区分
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
     * 数据到达后同步到 Redux
     */
    useEffect(() => {
        // 加载中 → 等完成，不写入半截数据
        if (loading || !data) return;

        // 请求失败 → 不清空已有画布，
        // 让用户报错时仍能看到原来的问卷，而不是一片空白
        if (error) return;

        const { title = '', componentList = [] } = data;

        /**
         * 默认选中第一项
         *
         * - 加载完就选中第一项，右侧属性面板立刻有内容
         * - 列表为空时保持 ''，面板显示「请选择一个组件」空状态
         * - 这是纯前端编辑态，不存后端
         */
        let selectedId = '';
        if (componentList.length > 0) {
            selectedId = componentList[0].fe_id;
        }

        /**
         * 整体替换画布组件
         *
         * 入参：{ componentList, selectedId }
         *
         * ⚠️ 若 reducer 是整包透传（return action.payload），
         *   接口多余字段会进 store；建议在 reducer 里显式挑字段
         *
         * 必须用 reset 而非 merge：切换问卷时整体替换，否则旧组件残留
         */
        dispatch(resetComponents({ componentList, selectedId }));

        // title 暂未消费，void 喂 ESLint
        // 后续接 Header 显示问卷标题时删掉这行
        void title;
    }, [loading, data, error, dispatch]);

    /**
     * 发起请求
     *
     * 执行顺序：
     * 1. 组件挂载 → run() → 请求发出，data 仍是默认 {}
     * 2. 上面的 effect 先跑一次：loading 为 true，被第一行拦下
     * 3. 请求返回 → data 更新 → effect 再跑，写入真实数据
     *
     * 第 2 步「dispatch 空列表」那一帧可能存在，
     * 所以画布必须先按 loading 渲染 Spin，避免闪一下空白
     */
    useEffect(() => {
        run();
    }, [id, run]);

    /**
     * 只暴露请求状态，不暴露 data
     *
     * 问卷数据统一从 Redux 读取，避免「同一份数据两个来源」不同步
     * 页面只需关心「加载中吗 / 出错了吗」
     */
    return { loading, error };
}

export default useLoadQuestionData;
