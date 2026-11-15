/**
 * @description 加载问卷列表数据的自定义 Hook
 *
 * ── 核心设计：URL 即状态 ──
 * 列表的「搜索关键字 / 页码 / 每页条数」全部存放在 URL 查询参数上，
 * 不放在组件 state 里。
 *
 * 好处：
 * - 刷新、复制链接、前进后退，列表状态都能还原
 * - 搜索框、分页器、列表共享同一份状态，无需层层传参
 * - 搜索框只需 setSearchParams，列表自动重新请求，两者完全解耦
 *
 * ── 数据流 ──
 * URL 参数变化 → searchParams 引用变化 → refreshDeps 触发重新请求 → 返回 { list, total }
 *
 * @param opt 可选的固定筛选条件（标星 / 回收站），按页面写死
 * @returns loading / data / error / refresh
 */

import { useSearchParams } from 'react-router-dom';
import { useRequest } from 'ahooks';
import { getQuestionListService } from '../services/question';

// URL 参数名与默认分页配置
import {
    LIST_SEARCH_PARAM_KEY, // 搜索关键字参数名，如 ?keyword=xxx
    LIST_PAGE_PARAM_KEY, // 页码参数名，如 ?page=2
    LIST_PAGE_SIZE_PARAM_KEY, // 每页条数参数名，如 ?pageSize=10
    LIST_PAGE_SIZE, // 每页条数默认值
} from '../constant';

/**
 * 列表筛选条件
 *
 * - isStar    ：true → 只查「标星」问卷
 * - isDeleted ：true → 只查「回收站」问卷
 * - 两者都不传 → 查正常问卷列表
 *
 * 用 Partial：调用方可以只传其中一个，另一个由接口默认值处理
 */
type OptionType = {
    isStar: boolean;
    isDeleted: boolean;
};

function useLoadQuestionListData(opt?: Partial<OptionType>) {
    // 页面级固定条件（不来自 URL）
    // Star 页面传 { isStar: true }，Trash 页面传 { isDeleted: true }
    const { isStar, isDeleted } = opt || {};

    /**
     * 读取 URL 查询参数
     *
     * searchParams 是 URLSearchParams 实例，
     * URL 变化时 react-router 返回新引用 → refreshDeps 浅比较判定变化 → 自动重新请求
     */
    const [searchParams] = useSearchParams();

    const {
        loading,
        data = {}, // 兜底空对象，避免调用方解构时报错
        error,
        refresh, // 保持当前参数手动重新请求，适合「操作后刷新列表」
    } = useRequest(
        async () => {
            /**
             * 从 URL 现读参数，保证每次执行拿到最新值
             */
            const keyword = searchParams.get(LIST_SEARCH_PARAM_KEY) || '';

            // parseInt 失败得 NaN（falsy），|| 1 兜底第 1 页
            const page = parseInt(searchParams.get(LIST_PAGE_PARAM_KEY) || '') || 1;

            // 同理，解析失败回退到全局默认 LIST_PAGE_SIZE
            const pageSize =
                parseInt(searchParams.get(LIST_PAGE_SIZE_PARAM_KEY) || '') || LIST_PAGE_SIZE;

            // isStar / isDeleted 可能是 undefined，序列化时由后端按默认值处理
            const data = await getQuestionListService({
                keyword,
                isStar,
                isDeleted,
                page,
                pageSize,
            });

            // 约定返回结构：{ list: QuestionItem[], total: number }
            return data;
        },
        {
            /**
             * 自动重新请求依赖
             *
             * searchParams 是对象，URL 一变就换新引用，
             * ahooks 浅比较判定变化 → 自动重新请求
             *
             * isStar / isDeleted 故意不加入：
             * 它们是页面级固定条件，同一页面生命周期内不变
             * 若将来需要动态切换（如 Tab 切全部/标星），必须加入此数组
             */
            refreshDeps: [searchParams],
        }
    );

    // 调用方通常这样用：
    // const { loading, data: { list = [], total = 0 } = {} } = useLoadQuestionListData({ isStar: true })
    return { loading, data, error, refresh };
}

export default useLoadQuestionListData;
