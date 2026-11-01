import { useSearchParams } from 'react-router-dom';
import { useRequest } from 'ahooks';
import { getQuestionListService } from '../services/question';
import {
    LIST_SEARCH_PARAM_KEY,
    LIST_PAGE_PARAM_KEY,
    LIST_PAGE_SIZE_PARAM_KEY,
    LIST_PAGE_SIZE,
} from '../constant';

type OptionType = {
    isStar: boolean;
    isDeleted: boolean;
};

/**
 * 加载问卷列表数据的自定义 Hook
 * 从 URL 查询参数中读取搜索关键字并请求问卷列表，
 * URL 参数变化时自动重新请求
 */
function useLoadQuestionListData(opt?: Partial<OptionType>) {
    const { isStar, isDeleted } = opt;

    // 获取 URL 上的查询参数
    const [searchParams] = useSearchParams();

    const {
        loading,
        data = {},
        error,
        refresh,
    } = useRequest(
        async () => {
            // 从 URL 中读取搜索关键字，不存在则默认为空字符串
            const keyword = searchParams.get(LIST_SEARCH_PARAM_KEY) || '';
            const page = parseInt(searchParams.get(LIST_PAGE_PARAM_KEY) || '') || 1;
            const pageSize =
                parseInt(searchParams.get(LIST_PAGE_SIZE_PARAM_KEY) || '') || LIST_PAGE_SIZE;

            // 调用接口获取问卷列表数据
            const data = await getQuestionListService({
                keyword,
                isStar,
                isDeleted,
                page,
                pageSize,
            });

            return data;
        },
        {
            // 搜索参数变化时重新请求
            refreshDeps: [searchParams],
        }
    );

    return { loading, data, error, refresh };
}

export default useLoadQuestionListData;
