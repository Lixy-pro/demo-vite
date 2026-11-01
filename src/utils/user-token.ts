/**
 * @description 用户 Token 本地存储工具
 * 基于 localStorage 实现 Token 的存取与清除，
 * 用于登录状态保持和权限校验。
 * @author 李老师
 */

import { setSafeItem, getSafeItem, removeSafeItem } from './safe-storage';

// 本地存储 Token 的 key
const KEY = 'USER_TOKEN';

/**
 * 保存用户 Token
 * @param {string} token - 用户登录成功后返回的身份凭证
 */
export function setToken(token: string) {
    setSafeItem(KEY, token, {
        expires: 1000 * 60 * 60, // 1 小时过期
        engine: 'session', // 关闭标签页即清除
    });
}

/**
 * 获取用户 Token
 * @returns {string} 当前存储的 Token，若不存在则返回空字符串
 */
export function getToken() {
    return getSafeItem<string>(KEY, 'session');
}

/**
 * 清除用户 Token
 * 常用于退出登录或登录失效时清理本地状态
 */
export function removeToken() {
    removeSafeItem(KEY, 'session');
}
