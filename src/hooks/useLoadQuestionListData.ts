import { useSearchParams } from 'react-router-dom';
import { useRequest } from 'ahooks';
import { getQuestionListService } from '../services/question';

// 列表相关的 URL 参数名与默认分页配置
import {
    LIST_SEARCH_PARAM_KEY, // 搜索关键字参数名，如  ?keyword=xxx
    LIST_PAGE_PARAM_KEY, // 页码参数名，如  ?page=2
    LIST_PAGE_SIZE_PARAM_KEY, // 每页条数参数名，如  ?pageSize=10
    LIST_PAGE_SIZE, // 每页条数默认值
} from '../constant';

/**
 * 列表筛选条件（可选覆盖项）
 *
 * 说明：
 * - isStar   ：true  → 只查「标星」的问卷
 * - isDeleted：true  → 只查「回收站」中的问卷
 * - 两者都不传 → 查正常的问卷列表
 *
 * 为什么用 Partial：
 * - 调用方可以只传其中一个，另一个交给接口默认值处理
 */
type OptionType = {
    isStar: boolean;
    isDeleted: boolean;
};

/**
 * 加载问卷列表数据的自定义 Hook
 *
 * ── 核心设计：URL 即状态 ──
 * 列表的「搜索关键字 / 页码 / 每页条数」不放在组件 state 里，
 * 而是全部存放在 URL 查询参数上。
 *
 * 这样做的好处：
 * - 刷新页面、复制链接、前进后退，列表状态都能还原
 * - 多个组件（搜索框、分页器、列表）共享同一份状态，无需层层传参
 * - 搜索框只需 setSearchParams，列表就会自动重新请求，两者完全解耦
 *
 * ── 数据流 ──
 * URL 参数变化
 *   → searchParams 引用变化
 *   → refreshDeps 触发 useRequest 重新执行
 *   → 用新参数调接口
 *   → 返回 { list, total }
 *
 * @param opt 可选的固定筛选条件（标星 / 回收站），通常按页面写死
 * @returns loading / data / error / refresh
 */
function useLoadQuestionListData(opt?: Partial<OptionType>) {
    // 解构外部传入的筛选条件
    // 注意：这两个值不来自 URL，属于「页面级固定条件」
    //      例如 Star 页面传 { isStar: true }，Trash 页面传 { isDeleted: true }
    const { isStar, isDeleted } = opt;

    /**
     * 读取 URL 查询参数
     * - 这里只取不写，所以忽略第二个元素 setSearchParams
     * - searchParams 是 URLSearchParams 实例，
     *   每当 URL 变化时 react-router 会给出新的实例（引用变化，这是 refreshDeps 生效的前提）
     */
    const [searchParams] = useSearchParams();

    const {
        loading, // 请求进行中，用于列表区 loading 态
        data = {}, // 接口返回数据，默认空对象，避免调用方解构时报错
        error, // 请求错误信息，无错误时为 undefined
        refresh, // 手动重新请求（保持当前参数不变），适合「操作后刷新列表」
    } = useRequest(
        // ── 请求函数 ──
        // 每次执行都「现读」一次 URL 参数，保证拿到的是最新值
        async () => {
            /**
             * 搜索关键字
             * - get 不到时返回 null，用 || '' 兜底为空字符串
             * - 空字符串对后端等价于「不筛选」，无需额外判断
             */
            const keyword = searchParams.get(LIST_SEARCH_PARAM_KEY) || '';

            /**
             * 页码
             * - parseInt 结果可能是 NaN（参数不存在或非数字）
             * - NaN 是 falsy，所以再 || 1 兜底为第 1 页
             * - 两个 || 连用是「解析失败就用默认值」的惯用写法
             */
            const page = parseInt(searchParams.get(LIST_PAGE_PARAM_KEY) || '') || 1;

            /**
             * 每页条数
             * - 同理，解析失败时回退到全局默认配置 LIST_PAGE_SIZE
             */
            const pageSize =
                parseInt(searchParams.get(LIST_PAGE_SIZE_PARAM_KEY) || '') || LIST_PAGE_SIZE;

            // 组装请求参数并调用接口
            // isStar / isDeleted 可能是 undefined，
            // 序列化时会被忽略或传空，由后端按默认值处理
            const data = await getQuestionListService({
                keyword,
                isStar,
                isDeleted,
                page,
                pageSize,
            });

            // 返回值即为 useRequest 中的 data
            // 约定结构：{ list: QuestionItem[], total: number }
            return data;
        },
        {
            /**
             * 自动重新请求依赖
             *
             * 关键点：
             * - searchParams 是对象，URL 一变 react-router 就返回新引用
             * - ahooks 内部对 refreshDeps 做浅比较，引用变化即判定为「依赖变了」
             * - 所以搜索框改 keyword、分页器改 page，都会自动触发重新请求
             *
             * 注意：
             * - isStar / isDeleted 没有放进依赖，是有意为之
             *   它们属于「页面级固定条件」，同一页面生命周期内不会变化
             * - 若某天需要动态切换（如 Tab 切「全部 / 标星」），
             *   必须把它们加入 refreshDeps，否则切换后列表不刷新
             */
            refreshDeps: [searchParams],
        }
    );

    // 对外暴露请求状态与数据
    // 调用方通常这样用：
    //   const { loading, data: { list = [], total = 0 } = {} } = useLoadQuestionListData({ isStar: true })
    return { loading, data, error, refresh };
}

export default useLoadQuestionListData;
