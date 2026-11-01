/**
 * 鉴权守卫工具
 * 统一处理 401 鉴权失效场景：清理本地凭证、跳转登录页、防止重复跳转
 *
 * 设计要点：
 * - 同时支持 HTTP 401 与业务层 errCode === 401 两种判定口径
 * - 内置防重入锁，避免并发 401 引发跳转风暴
 * - 未登录态访问需鉴权接口时静默拒绝，不弹提示
 * - 白名单接口（登录/注册等）的 401 不被劫持跳转
 */

import { message } from 'antd';
import { isPathMatchAny } from '../utils/path-match';
import { removeToken } from '../utils/user-token';

/**
 * 登录页路径
 * ⚠️ 若项目中实际导出名或路径不同，请修改为真实值
 */
import { LOGIN_PATHNAME } from '../router';

/** 不需要触发 401 跳转的接口（登录、注册本身返回 401 是正常业务） */
const AUTH_WHITELIST: Array<string | RegExp> = ['/api/user/login', '/api/user/register'];

/** 防重入锁：记录已处理过的失效原因，避免并发 401 重复跳转 */
const handledReasons = new Set<string>();
const LOCK_TTL = 5000;

/**
 * 判断是否为 HTTP 401 响应
 */
export function isHttp401(error: { response?: { status?: number } | null }): boolean {
    return error.response?.status === 401;
}

/**
 * 判断是否为业务层 401（errCode === 401）
 */
export function isBusiness401(errCode: unknown): boolean {
    return typeof errCode === 'number' && errCode === 401;
}

/**
 * 判断是否应当介入处理该错误
 * - 非 HTTP 错误（网络断开、超时等）不介入
 * - 白名单内的接口不介入（避免登录接口自己返回 401 被劫持）
 */
export function shouldInterceptError(error: {
    response?: { status?: number; config?: { url?: string } } | null;
}): boolean {
    if (!error.response) return false;

    const url = error.response.config?.url;
    if (url && isPathMatchAny(url, AUTH_WHITELIST)) return false;

    return true;
}

/**
 * 处理鉴权失效：清理凭证、跳转登录页
 * 内置防重入锁，同一原因在 LOCK_TTL 内只执行一次
 *
 * @param reason - 失效原因，同时作为提示文案与锁的 key
 */
export function handleAuthFailure(reason: string): void {
    if (handledReasons.has(reason)) return;

    handledReasons.add(reason);
    setTimeout(() => handledReasons.delete(reason), LOCK_TTL);

    // 清理本地凭证
    removeToken();

    // 提示用户
    message.error(reason);

    // 跳转登录页（整页跳转，确保清空所有内存态）
    if (typeof window !== 'undefined') {
        const redirect = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `${LOGIN_PATHNAME}?redirect=${redirect}`;
    }
}
