/**
 * @description 路径匹配工具
 * 用于 HTTP 请求 URL 的权限判定（如是否跳过 Token 注入）。
 *
 * 设计说明：
 * 1. 支持两种匹配模式：
 *    - 字符串精确匹配：必须完全相等
 *    - 正则表达式匹配：自动忽略 URL 查询字符串（? 之后）与 hash（# 之后）
 *
 * 2. 为什么要在匹配前剥离查询串？
 *    实际请求 URL 经常带有分页、筛选等参数，例如：
 *    /api/query/questionList?page=1&pageSize=10&isDeleted=true
 *    若只用字符串比较，白名单 "/api/query/questionList" 将无法命中。
 *    因此统一按 pathname 进行匹配。
 *
 * 3. 安全边界：
 *    - 本工具只负责"路径是否匹配"，不做鉴权决策
 *    - 正则由项目内部维护，不要直接拼接用户输入，避免 ReDoS
 *
 * @author 李老师
 */

/**
 * 匹配规则类型
 * - string：精确路径匹配
 * - RegExp：按 pathname 正则匹配
 */
export type PathMatchRule = string | RegExp;

/**
 * 从完整 URL 中提取 pathname
 * 优先使用浏览器原生 URL API，兼容性更好、边界更准
 *
 * @param url - 完整请求 URL，可能是相对路径或绝对路径
 * @returns 路径部分，解析失败时返回原值
 *
 * 示例：
 *   '/api/user/login?redirect=/home' => '/api/user/login'
 *   'https://example.com/api/user/login#top' => '/api/user/login'
 */
function extractPathname(url: string): string {
    if (!url) return url;

    // 相对路径需要拼接一个基准才能被 URL 正确解析
    const isAbsolute = /^https?:\/\//i.test(url);
    const base = isAbsolute ? undefined : 'http://localhost';

    try {
        const parsed = new URL(url, base);
        return parsed.pathname;
    } catch {
        // 兜底：手动移除查询串与 hash
        return url.split(/[?#]/)[0];
    }
}

/**
 * 判断请求 URL 是否匹配指定规则
 *
 * @param url - 请求 URL（可能包含查询参数或 hash）
 * @param rule - 匹配规则（字符串或正则）
 * @returns 是否匹配
 *
 * 示例：
 *   isPathMatch('/api/user/login?a=1', '/api/user/login')        // true
 *   isPathMatch('/api/query/questionList?page=1', /\/api\/query\/questionList/) // true
 *   isPathMatch('/api/user/info', /\/api\/user\/login/)          // false
 */
export function isPathMatch(url: string, rule: PathMatchRule): boolean {
    if (!url) return false;

    if (typeof rule === 'string') {
        // 字符串模式：精确匹配 pathname
        return extractPathname(url) === rule;
    }

    // 正则模式：仅对 pathname 进行匹配，忽略查询参数与 hash
    return rule.test(extractPathname(url));
}

/**
 * 判断请求 URL 是否匹配任一规则
 * 命中即返回 true，常用于白名单判定
 *
 * @param url - 请求 URL
 * @param rules - 匹配规则列表
 * @returns 是否命中任一规则
 *
 * 示例：
 *   const whiteList = [
 *     '/api/user/login',
 *     '/api/user/register',
 *     /\/api\/public\/.+/,
 *   ];
 *   isPathMatchAny('/api/public/banner?ver=2', whiteList) // true
 */
export function isPathMatchAny(url: string, rules: PathMatchRule[]): boolean {
    if (!rules || rules.length === 0) return false;
    return rules.some(rule => isPathMatch(url, rule));
}
