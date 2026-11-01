/* eslint-disable @typescript-eslint/no-explicit-any */
// 引入封装后的 axios 请求实例
import axios from './ajax';

// 引入统一的接口返回数据类型
import type { ResDataType } from './ajax';

/**
 * 问卷列表查询条件
 */
type SearchOption = {
    /** 搜索关键词 */
    keyword: string;

    /** 是否查询标星问卷 */
    isStar: boolean;

    /** 是否查询已删除（回收站）问卷 */
    isDeleted: boolean;

    /** 当前页码（从 1 开始） */
    page: number;

    /** 每页数量 */
    pageSize: number;
};

/**
 * 获取单个问卷详情
 * @param id - 问卷 ID
 * @returns 问卷数据（含标题、描述、组件列表等）
 * @route GET /api/question/:id
 */
export async function getQuestionService(id: string): Promise<ResDataType> {
    // 拼接问卷详情接口地址
    const url = `/api/question/${id}`;

    // 发送 GET 请求并断言返回数据类型
    const data = (await axios.get(url)) as ResDataType;

    return data;
}

/**
 * 创建一份空白问卷
 * @returns 新建问卷的数据（含服务端生成的 id）
 * @route POST /api/create/question
 */
export async function createQuestionService(): Promise<ResDataType> {
    // 创建问卷接口地址
    const url = '/api/create/question';

    // 发送 POST 请求，创建问卷
    const data = (await axios.post(url)) as ResDataType;

    return data;
}

/**
 * 查询当前用户的问卷列表
 * @param opt - 查询条件（可选，支持部分字段）
 * @returns 问卷列表数据（含分页信息与总数）
 * @route GET /api/query/questionList
 */
export async function getQuestionListService(
    opt: Partial<SearchOption> = {}
): Promise<ResDataType> {
    // 问卷列表查询接口地址
    const url = '/api/query/questionList';

    // 通过 params 传递查询参数，并断言返回数据类型
    const data = (await axios.get(url, { params: opt })) as ResDataType;

    return data;
}

/**
 * 批量删除问卷
 * @param ids - 待删除的问卷 ID 数组
 * @returns 删除结果
 * @route DELETE /api/delete/questions
 */
export async function deleteQuestionService(ids: string[]): Promise<ResDataType> {
    // 批量删除问卷接口地址
    const url = '/api/delete/questions';

    // 在 DELETE 请求体中传递待删除的 ID 列表
    const data = (await axios.delete(url, { data: { ids } })) as ResDataType;

    return data;
}

/**
 * 更新问卷信息
 * @param id - 问卷 ID
 * @param opt - 需要更新的字段（如 title、isStar、isDeleted 等）
 * @returns 更新结果
 * @route PATCH /api/question/:id
 */
export async function updateQuestionService(
    id: string,
    opt: { [key: string]: any }
): Promise<ResDataType> {
    // 拼接更新问卷接口地址
    const url = `/api/question/${id}`;

    // 发送 PATCH 请求，提交部分更新字段
    const data = (await axios.patch(url, opt)) as ResDataType;

    return data;
}

/**
 * 复制（ Duplicate ）问卷
 * @param id - 被复制的问卷 ID
 * @returns 复制结果（含新问卷 ID）
 * @route POST /api/question/duplicate/:id
 */
export async function duplicateQuestionService(id: string): Promise<ResDataType> {
    // 拼接复制问卷接口地址
    const url = `/api/question/duplicate/${id}`;

    // 发送 POST 请求，复制指定问卷
    const data = (await axios.post(url)) as ResDataType;

    return data;
}
