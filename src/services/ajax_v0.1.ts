/* eslint-disable @typescript-eslint/no-explicit-any */

// 引入 Ant Design 的全局消息提示组件
// 用于统一展示接口请求失败、业务错误等信息
import { message } from 'antd';

// 引入 axios，用于发起 HTTP 请求
// 引入 AxiosHeaders，用于显式初始化请求头实例
import axios, { AxiosHeaders } from 'axios';

// 引入路径匹配工具，用于判断接口是否在白名单内
import type { PathMatchRule } from '../utils/path-match';
import { isPathMatchAny } from '../utils/path-match';

// 引入 Token 获取方法，用于登录鉴权
import { getToken } from '../utils/user-token';

/**
 * 创建 axios 实例
 * 用于统一配置请求超时、默认请求头、拦截器等行为
 */
const instance = axios.create({
    // 请求超时时间：10 秒
    // 超过该时间未收到响应，axios 会触发超时错误
    timeout: 10 * 1000,

    // 显式传入 headers 实例，锁定类型为 AxiosRequestHeaders
    // 避免在拦截器中因 headers 可能为 {} 而产生类型错误
    headers: new AxiosHeaders(),
});

/**
 * 无需 Token 的接口白名单
 *
 * 匹配规则：
 * - string：精确匹配 pathname，自动忽略查询参数和 hash
 * - RegExp：按 pathname 执行正则匹配，适合批量放行一类接口
 *
 * 注意：
 * - 白名单只决定是否注入 Token，不承担权限判定
 * - 正则应尽量收敛，避免误放行需要鉴权的接口
 */
const noTokenList: PathMatchRule[] = [
    '/api/user/register',
    '/api/user/login',

    // 示例：列表接口带任意参数都放行
    // /\/api\/query\/questionList/,

    // 示例：所有公共接口
    // /\/api\/public\/.+/,
];

/**
 * 请求拦截器
 * 在请求发送前统一处理，如注入登录 Token
 */
instance.interceptors.request.use(
    config => {
        // 当前接口不在白名单内时，注入 Bearer Token
        // isPathMatchAny 内部会自动提取 pathname，因此带参 URL 也能正确匹配
        if (config.url && !isPathMatchAny(config.url, noTokenList)) {
            config.headers.Authorization = `Bearer ${getToken()}`;
        }

        // 返回处理后的请求配置，继续请求流程
        return config;
    },
    error => {
        // 请求配置阶段发生错误时，直接抛出
        return Promise.reject(error);
    }
);

/**
 * 响应拦截器（成功回调）
 * 统一处理后端返回的数据结构，简化业务层调用
 *
 * 假设后端统一返回格式为：
 * {
 *   errCode: number, // 错误码，0 表示成功
 *   data: any,        // 业务数据
 *   msg?: string      // 可选的提示信息
 * }
 */
instance.interceptors.response.use(
    res => {
        // 取出响应体，并断言为统一的响应结构
        const resData = (res.data || {}) as ResType;

        const { errCode, data, msg } = resData;

        // errCode 不为 0，表示业务处理失败
        if (errCode !== 0) {
            // 若存在错误提示信息，则展示全局错误提示
            if (msg) {
                message.error(msg);
            }

            // 抛出错误，阻断后续 then 逻辑
            // 调用方可通过 catch 捕获并处理
            throw new Error(msg || '请求失败');
        }

        // 业务成功时，只返回 data
        // 好处：业务层无需再手动解包 res.data
        // 代价：此处使用 as any，丢失了 data 的详细类型信息
        return data as any;
    },

    /**
     * 响应拦截器（失败回调）
     * 处理 HTTP 网络层错误，如超时、断网、5xx 等
     */
    error => {
        // 处理 HTTP 网络层错误（如超时、断网、5xx 等）
        if (error.response) {
            // 服务器返回了错误状态码
            message.error(`请求错误：${error.response.status}`);
        } else if (error.request) {
            // 请求已发出，但未收到响应
            message.error('服务器无响应，请稍后重试');
        } else {
            // 请求配置阶段出现错误
            message.error('请求失败，请检查网络或参数');
        }

        // 将错误继续抛出，交由调用方处理
        return Promise.reject(error);
    }
);

// 导出封装好的 axios 实例，供业务层统一使用
export default instance;

/**
 * 后端统一响应结构
 * 用于约束所有接口返回的数据格式
 */
export type ResType = {
    /**
     * 业务错误码
     * - 0 表示成功
     * - 非 0 表示业务异常
     */
    errCode: number;

    /**
     * 业务数据
     * 仅在请求成功（errCode === 0）时可靠存在
     */
    data?: ResDataType;

    /**
     * 提示信息
     * 常用于错误提示或操作结果说明
     */
    msg?: string;
};

/**
 * 业务数据类型
 * 使用任意键值对象，用于兼容多种接口返回结构
 *
 * ⚠️ 建议后续按业务接口进一步细化类型，
 * 例如：UserInfo、QuestionList 等，
 * 以提高类型安全性和可维护性。
 *
 * 当前使用 `[key: string]: any` 和 `as any`，
 * 是为了兼容不同接口结构，但会弱化类型校验。
 */
export type ResDataType = {
    [key: string]: any;
};
