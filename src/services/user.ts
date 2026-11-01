// 引入封装后的 axios 请求实例
// 已内置：请求头 Token 注入、响应解包、401 鉴权失效处理
import axios from './ajax';

// 引入 Token 读取方法，用于判断是否已登录
import { getToken } from '../utils/user-token';

// 引入统一的接口返回数据类型
import type { ResDataType } from './ajax';

/**
 * 获取当前登录用户信息
 * @route GET /api/user/info
 *
 * 行为说明：
 * - 已登录（存在 Token）时，请求用户信息接口
 * - 未登录时，直接返回 null，不发起请求
 *
 * @returns {Promise<ResDataType | null>}
 *  - 已登录：返回用户信息（如 username、nickname）
 *  - 未登录：返回 null
 *
 * @throws 接口业务失败或网络异常时，由 axios 拦截器统一处理后抛出异常
 */
export async function getUserInfoService(): Promise<ResDataType | null> {
    // 未登录态直接返回 null，避免发送无凭证请求
    console.log('555');
    if (!getToken()) {
        return null;
    }

    // 用户相关信息接口地址
    const url = '/api/user/info';

    // 发送 GET 请求
    // 响应拦截器已自动解包 data，此处返回类型即为业务数据
    const data = (await axios.get(url)) as ResDataType;

    return data;
}

/**
 * 用户注册服务
 * @route POST /api/user/register
 *
 * @param {string} username - 用户名（必填，需符合 6-20 位、字母数字下划线规则）
 * @param {string} password - 密码（必填，需符合 8-20 位、含字母数字特殊字符规则）
 * @param {string} [nickname] - 昵称（可选，未传时默认使用用户名）
 *
 * @returns {Promise<ResDataType>} 注册结果
 *  - 成功：业务层返回的数据（由响应拦截器解包）
 *  - 失败：由拦截器提示并抛出异常
 */
export async function registerUserInfoService(
    username: string,
    password: string,
    nickname?: string
): Promise<ResDataType> {
    // 注册接口地址（位于白名单内，不会注入 Token）
    const url = '/api/user/register';

    // 组装请求体
    const body = {
        username,
        password,
        // 若未传入昵称，则默认使用用户名作为昵称
        nickname: nickname || username,
    };

    // 发送 POST 请求，提交注册信息
    const data = (await axios.post(url, body)) as ResDataType;

    return data;
}

/**
 * 用户登录服务
 * @route POST /api/user/login
 *
 * @param {string} username - 用户名（必填）
 * @param {string} password - 密码（必填）
 *
 * @returns {Promise<ResDataType>} 登录结果
 *  - 成功：包含 token 等业务数据
 *  - 失败：由拦截器提示并抛出异常
 *
 * @remarks
 * 登录成功后，调用方应调用 setToken 保存返回的 token，
 * 并跳转至目标页面（通常是管理后台首页）。
 * 该接口位于白名单内，请求时不会注入 Token。
 */
export async function loginUserInfoService(
    username: string,
    password: string
): Promise<ResDataType> {
    // 登录接口地址（位于白名单内，不会注入 Token）
    const url = '/api/user/login';

    // 组装登录请求参数
    const body = {
        username,
        password,
    };

    // 发送 POST 请求，提交登录凭证
    const data = (await axios.post(url, body)) as ResDataType;

    return data;
}
