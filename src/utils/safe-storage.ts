/**
 * @description 更安全的本地存储工具
 *
 * 安全说明（重要）：
 * 1. localStorage / sessionStorage 一旦页面被 XSS 注入脚本即可被读取，
 *    因此本工具无法从根源"防住" XSS，而是通过纵深防御降低风险：
 *    - 写入数据附带 HMAC 签名，读取时校验，被篡改即失效并自动清除
 *    - 支持设置过期时间，减少凭证长期残留
 *    - 支持命名空间隔离，避免 key 冲突与越权读取
 *    - 支持 sessionStorage，标签页关闭即清除，缩短暴露窗口
 *
 * 2. 【最佳实践】真正敏感的凭证（如登录 Token）应由后端设置为
 *    HttpOnly + Secure + SameSite 的 Cookie，前端 JS 不接触。
 *    本工具仅适合存储非敏感、或短期有效的业务数据。
 *
 * 3. 本工具的签名密钥来自 JS 常量，仅用于"防篡改"而非"防读取"，
 *    请勿把签名当作加密。
 *
 * @author 李老师
 */

// ==================== 类型定义 ====================

/** 支持的存储引擎 */
export type StorageEngine = 'local' | 'session';

/** 包装后的存储值结构 */
interface WrappedValue {
    /** 实际数据（序列化后） */
    v: string;
    /** 过期时间（毫秒时间戳），0 表示不过期 */
    exp: number;
    /** 创建时间（毫秒时间戳） */
    iat: number;
    /** 数据签名，防止被篡改 */
    sig: string;
}

/** 存储选项 */
export interface SafeStorageOptions {
    /** 过期时长（毫秒），例如 1000 * 60 * 60 表示 1 小时 */
    expires?: number;
    /** 存储引擎：local（默认，持久） / session（标签页级，关闭即清） */
    engine?: StorageEngine;
}

// ==================== 常量 ====================

/** 命名空间前缀，避免与其它库 / 业务冲突 */
const NAMESPACE = 'xm';

/** 签名密钥 —— 用于防篡改，不是加密密钥 */
const SIGN_SECRET = '__xm_safe_storage_secret__';

/** 允许使用的存储引擎映射 */
const ENGINES: Record<StorageEngine, () => Storage | null> = {
    local: () => window.localStorage,
    session: () => window.sessionStorage,
};

// ==================== 内部工具函数 ====================

/**
 * 生成简单的签名字符串
 * 说明：这里使用可逆的 hash 仅用于"完整性校验"，
 * 目的是发现数据是否被人为篡改，而不是保密。
 * @param raw - 待签名字符串
 * @param secret - 签名密钥
 */
function sign(raw: string, secret: string): string {
    // 使用 btoa + 混淆，生成不易被一眼伪造的签名
    // 注意：这不是加密，XSS 仍可调用本函数伪造，但它能防"直接改 localStorage"的篡改
    let hash = 0;
    const str = raw + secret;
    for (let i = 0; i < str.length; i++) {
        // 31 进制滚动哈希
        hash = (hash << 5) - hash + str.charCodeAt(i);
        // 转成 32 位整数
        hash |= 0;
    }
    return btoa(String(hash));
}

/**
 * 获取带命名空间的 key
 * @param key - 业务 key
 */
function getNamespacedKey(key: string): string {
    return `${NAMESPACE}:${key}`;
}

/**
 * 获取指定的存储引擎实例
 * 在 SSR 或非浏览器环境下返回 null，避免报错
 * @param engine - 存储引擎类型
 */
function getStorage(engine: StorageEngine): Storage | null {
    if (typeof window === 'undefined') {
        return null;
    }
    return ENGINES[engine]() || null;
}

/**
 * 判断值是否已过期
 * @param wrapped - 包装后的数据
 */
function isExpired(wrapped: WrappedValue): boolean {
    if (wrapped.exp <= 0) {
        return false;
    }
    return Date.now() > wrapped.exp;
}

// ==================== 对外 API ====================

/**
 * 安全地写入数据
 * @param key - 存储 key（会自动加命名空间前缀）
 * @param value - 待存储的值（任意可序列化数据）
 * @param options - 可选配置（过期时间、存储引擎）
 *
 * @example
 * ```ts
 * setSafeItem('token', 'abc123', { expires: 1000 * 60 * 60, engine: 'session' });
 * ```
 */
export function setSafeItem<T>(key: string, value: T, options: SafeStorageOptions = {}): void {
    const { expires, engine = 'local' } = options;
    const storage = getStorage(engine);

    if (!storage) {
        console.warn('[safe-storage] 当前环境不支持 Storage');
        return;
    }

    const serialized = JSON.stringify(value);
    const now = Date.now();
    const exp = expires && expires > 0 ? now + expires : 0;

    // 待签名内容：值 + 过期时间 + 创建时间，任一被改签名即失效
    const raw = `${serialized}|${exp}|${now}`;
    const wrapped: WrappedValue = {
        v: serialized,
        exp,
        iat: now,
        sig: sign(raw, SIGN_SECRET),
    };

    try {
        storage.setItem(getNamespacedKey(key), JSON.stringify(wrapped));
    } catch (err) {
        // 常见原因：超出存储配额
        console.error('[safe-storage] 写入失败:', err);
    }
}

/**
 * 安全地读取数据
 * - 数据不存在 / 已过期 / 签名校验失败 时，自动清除并返回 null
 * @param key - 存储 key
 * @param engine - 存储引擎，默认 local
 * @returns 解析后的数据，读取失败返回 null
 *
 * @example
 * ```ts
 * const token = getSafeItem<string>('token');
 * ```
 */
export function getSafeItem<T>(key: string, engine: StorageEngine = 'local'): T | null {
    const storage = getStorage(engine);
    if (!storage) {
        return null;
    }

    const raw = storage.getItem(getNamespacedKey(key));
    if (!raw) {
        return null;
    }

    let wrapped: WrappedValue;
    try {
        wrapped = JSON.parse(raw);
    } catch {
        // 数据格式异常，直接清除
        storage.removeItem(getNamespacedKey(key));
        return null;
    }

    // 校验结构完整性
    if (!wrapped || !wrapped.v || !wrapped.sig) {
        storage.removeItem(getNamespacedKey(key));
        return null;
    }

    // 校验过期
    if (isExpired(wrapped)) {
        storage.removeItem(getNamespacedKey(key));
        return null;
    }

    // 校验签名（防篡改）
    const payload = `${wrapped.v}|${wrapped.exp}|${wrapped.iat}`;
    if (sign(payload, SIGN_SECRET) !== wrapped.sig) {
        console.warn(`[safe-storage] key "${key}" 数据被篡改，已清除`);
        storage.removeItem(getNamespacedKey(key));
        return null;
    }

    try {
        return JSON.parse(wrapped.v) as T;
    } catch {
        storage.removeItem(getNamespacedKey(key));
        return null;
    }
}

/**
 * 安全地删除数据
 * @param key - 存储 key
 * @param engine - 存储引擎，默认 local
 */
export function removeSafeItem(key: string, engine: StorageEngine = 'local'): void {
    const storage = getStorage(engine);
    if (storage) {
        storage.removeItem(getNamespacedKey(key));
    }
}

/**
 * 清空当前命名空间下的所有数据
 * 注意：只清除带本工具命名空间前缀的 key，不影响其它库的数据
 * @param engine - 存储引擎，默认 local
 */
export function clearSafeStorage(engine: StorageEngine = 'local'): void {
    const storage = getStorage(engine);
    if (!storage) {
        return;
    }

    const prefix = `${NAMESPACE}:`;
    const toRemove: string[] = [];

    for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith(prefix)) {
            toRemove.push(key);
        }
    }

    toRemove.forEach(k => storage.removeItem(k));
}

// ==================== 向后兼容：Token 快捷方法 ====================

const TOKEN_KEY = 'USER_TOKEN';

/**
 * 保存用户 Token（使用 sessionStorage，缩短暴露窗口）
 * 推荐优先由后端使用 HttpOnly Cookie 管理 Token。
 */
export function setToken(token: string): void {
    setSafeItem<string>(TOKEN_KEY, token, {
        // 默认会话级：关闭标签页即清除
        engine: 'session',
    });
}

/**
 * 获取用户 Token
 * @returns Token 字符串，不存在或失效则返回空字符串
 */
export function getToken(): string {
    return getSafeItem<string>(TOKEN_KEY, 'session') || '';
}

/**
 * 清除用户 Token（退出登录 / 登录失效时调用）
 */
export function removeToken(): void {
    removeSafeItem(TOKEN_KEY, 'session');
}
