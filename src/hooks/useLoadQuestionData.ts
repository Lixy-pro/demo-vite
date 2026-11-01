import { useParams } from 'react-router-dom';
import { useRequest } from 'ahooks';
import { getQuestionService } from '../services/question';

/**
 * 自定义 Hook：加载问卷数据
 * 从路由参数中获取问卷 id，调用服务接口获取问卷详情数据
 * 使用 ahooks 的 useRequest 管理请求状态
 */
function useLoadQuestionData() {
    // 从路由参数中读取问卷 id，不存在时默认为空字符串
    const { id = '' } = useParams();

    // 定义请求函数：根据 id 调用问卷详情接口
    async function load() {
        const data = await getQuestionService(id);
        return data;
    }

    // 使用 useRequest 管理请求状态
    // loading: 是否加载中, data: 返回的问卷数据, error: 错误信息
    const { loading, data = {}, error } = useRequest(load);

    return { loading, data, error };
}

export default useLoadQuestionData;
