/* eslint-disable @typescript-eslint/no-explicit-any */

// Ant Design 全局消息提示，用于统一展示错误与业务提示
import { message } from 'antd';

// axios 核心与类型
// - AxiosHeaders：用于显式初始化默认请求头，锁定类型
// - AxiosError：用于约束响应失败分支的错误类型
import axios, { AxiosHeaders, type AxiosError } from 'axios';

// 路径匹配工具：判断请求 URL 是否命中白名单
import type { PathMatchRule } from '../utils/path-match';
import { isPathMatchAny } from '../utils/path-match';

// Token 读取方法（用于请求头注入）
import { getToken } from '../utils/user-token';

// 鉴权守卫工具
// - handleAuthFailure：统一处理鉴权失效（清凭证 + 提示 + 跳转）
// - isHttp401：判定 HTTP 层 401
// - isBusiness401：判定业务层 errCode === 401
// - shouldInterceptError：判定当前错误是否需要介入处理
import {
    handleAuthFailure,
    isBusiness401,
    isHttp401,
    shouldInterceptError,
} from '../utils/auth-guard';

/**
 * 创建 axios 实例
 * 统一配置：
 * - 请求超时时间
 * - 默认请求头实例（类型锁定为 AxiosRequestHeaders）
 * - 后续通过拦截器统一注入 Token 与处理错误
 */
const instance = axios.create({
    // 请求超时时间：10 秒
    // 超时触发后进入响应失败分支（error.code === 'ECONNABORTED'）
    timeout: 10 * 1000,

    // 显式传入 headers 实例
    // 避免 headers 被推断为 AxiosRequestHeaders | {} 导致的类型错误
    headers: new AxiosHeaders(),
});

/**
 * 无需注入 Token 的接口白名单
 *
 * 匹配规则：
 * - string：精确匹配 pathname，自动忽略查询参数与 hash
 * - RegExp：按 pathname 执行正则匹配
 *
 * 作用边界：
 * - 只决定「是否注入 Authorization」，不承担权限判定
 * - 鉴权失效的跳转豁免由 auth-guard 内的 AUTH_WHITELIST 负责，两者不重复
 */
const noTokenList: PathMatchRule[] = [
    '/api/user/register',
    '/api/user/login',

    // 示例：列表接口带任意参数均不注入 Token
    // /\/api\/query\/questionList/,

    // 示例：所有公共接口
    // /\/api\/public\/.+/,
];

/**
 * 请求拦截器
 * 在请求发出前统一注入登录凭证
 */
instance.interceptors.request.use(
    config => {
        // 仅对白名单外的接口注入 Bearer Token
        // isPathMatchAny 内部会剥离 ? 与 #，因此带参 URL 也能正确匹配
        if (config.url && !isPathMatchAny(config.url, noTokenList)) {
            const token = getToken();
            if (!token) {
                // handleAuthFailure('登录状态已失效，请重新登录');
                throw new Error('Token已过期');
            }
            config.headers.Authorization = `Bearer ${token}`;
        }

        // 返回处理后的配置，继续请求流程
        return config;
    },

    // 请求配置阶段发生错误（如参数非法），直接透传
    error => Promise.reject(error)
);

/**
 * 响应拦截器
 *
 * 后端统一返回结构约定：
 * {
 *   errCode: number, // 0 成功，非 0 业务异常
 *   data: any,
 *   msg?: string
 * }
 *
 * 执行顺序说明（重要）：
 * 1. HTTP 状态码非 2xx / 网络异常 / 超时  → 直接进入【失败分支】
 * 2. HTTP 200 + 后端业务结构              → 进入【成功分支】
 * 3. 成功分支中 throw 的错误              → 会再次进入【失败分支】
 *
 * 因此失败分支需要区分：
 * - axios 自身的错误（error.isAxiosError === true）
 * - 成功分支主动抛出的业务错误（原生 Error，isAxiosError 不存在或为 false）
 */
instance.interceptors.response.use(
    /**
     * 成功分支：处理 HTTP 2xx 返回，解包后端业务结构
     */
    res => {
        // 取出响应体并断言为统一响应结构
        const resData = (res.data || {}) as ResType;

        const { errCode, data, msg } = resData;

        /**
         * 业务层 401（如 Token 合法但已过期、被踢下线）
         *
         * 注意：
         * - 此时 HTTP 状态码是 200，不会走 isHttp401
         * - 这里调用 handleAuthFailure 后会 throw，
         *   错误会流转到失败分支，由 isAxiosError 判断分流，避免重复提示
         */
        if (isBusiness401(errCode)) {
            handleAuthFailure('登录状态已失效，请重新登录');
            throw new Error(msg || '登录状态已失效');
        }

        // 其余业务失败（errCode 非 0 且非 401）
        if (errCode !== 0) {
            // 展示后端返回的业务错误提示
            if (msg) message.error(msg);

            // 抛出错误，交由调用方 catch 处理
            throw new Error(msg || '请求失败');
        }

        // 业务成功：只返回 data
        // 业务层无需再 res.data.xxx 解包
        // 注：as any 会丢失 data 的具体类型，建议后续改为泛型封装
        return data as any;
    },

    /**
     * 失败分支：处理 HTTP 层错误与鉴权失效
     *
     * 触发时机（满足任一即进入）：
     * - 服务器返回 4xx / 5xx 响应
     * - 网络断开、DNS 失败、跨域被拦截
     * - 请求超时（10 秒无响应）
     * - 请求被取消
     * - 成功分支中主动 throw 的错误
     *
     * @param error - axios 封装的错误对象
     */
    (error: AxiosError<ResType>) => {
        /**
         * 分流关键：排除成功分支主动抛出的业务错误
         *
         * - axios 错误：带 isAxiosError = true，需要继续处理
         * - 原生 Error（来自成功分支 throw）：不带该标记，直接透传
         *
         * 这样可以避免：
         * 1. 业务 401 已经由 handleAuthFailure 提示并跳转后，再次弹窗
         * 2. 业务错误被误判为网络错误，显示“请求失败，请检查网络”
         */
        if (error.isAxiosError === false) {
            return Promise.reject(error);
        }

        // 判定当前错误是否需要介入（非 HTTP 错误 / 白名单接口直接放行）
        if (shouldInterceptError(error)) {
            /**
             * 已登录态下的 HTTP 401
             * 判定为 Token 失效或服务端拒绝
             * 清理凭证并跳转登录页（带 redirect 回到原页面）
             */
            if (isHttp401(error) && getToken()) {
                handleAuthFailure('登录已过期，请重新登录');
                return Promise.reject(error);
            }

            /**
             * 未登录态访问需鉴权接口
             * 静默拒绝，不弹提示，避免打开页面瞬间弹窗
             */
            if (isHttp401(error)) {
                return Promise.reject(error);
            }
        }

        // 其余 HTTP 错误（4xx / 5xx，非 401）
        if (error.response) {
            message.error(`请求错误：${error.response.status}`);
        }
        // 网络层错误：请求已发出但无响应
        else if (error.request) {
            message.error('服务器无响应，请稍后重试');
        }
        // 请求配置阶段错误
        else {
            message.error('请求失败，请检查网络或参数');
        }

        // 始终透传错误，确保调用方的 catch 能正常捕获
        return Promise.reject(error);
    }
);

// 导出封装后的 axios 实例，业务层统一使用
export default instance;

/**
 * 后端统一响应结构
 * 所有接口返回均应遵循此格式
 */
export type ResType = {
    /**
     * 业务错误码
     * - 0：成功
     * - 401：业务层鉴权失效（Token 过期 / 被踢下线）
     * - 其他非 0：业务异常
     */
    errCode: number;

    /**
     * 业务数据
     * 仅在 errCode === 0 时可靠存在
     */
    data?: ResDataType;

    /**
     * 提示信息
     * 用于全局错误提示或操作结果说明
     */
    msg?: string;
};

/**
 * 业务数据类型
 *
 * @deprecated 当前为 any 结构，便于兼容多接口，但会弱化类型校验。
 * 建议后续按业务拆分为：
 * - UserInfo
 * - QuestionList
 * - QuestionDetail
 * 等具体类型，并配合泛型 request<T>() 使用。
 */
export type ResDataType = {
    [key: string]: any;
};
