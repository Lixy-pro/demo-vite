/**
 * 自定义 Hook：获取当前登录用户信息
 *
 * 职责：
 * - 从 Redux store 中读取用户相关状态
 * - 对外提供统一的 username / nickname 访问方式
 * - 对异常或初始状态做兜底处理，避免组件因 undefined 解构而崩溃
 *
 * 设计说明：
 * - 登录态以 Redux 中的 username 是否存在为准
 * - `state.user` 在应用初始化或异常情况下可能为 undefined
 * - 通过默认值确保返回值始终是可安全解构的对象
 * - 这是一个纯读取 Hook，不触发任何副作用
 */

// Redux：用于从全局状态中读取数据
import { useSelector } from 'react-redux';

// 全局 Root State 类型
import type { StateType } from '../store';

// 用户模块 State 类型
import type { UserStateType } from '../store/userReducer';

/**
 * 获取用户信息的自定义 Hook
 *
 * @returns {{ username: string, nickname: string }}
 *   - username：用户名（空字符串表示未登录）
 *   - nickname：用户昵称（空字符串表示未设置）
 */
function useGetUserInfo() {
    /**
     * 从 Redux store 中读取 user 状态
     *
     * 安全策略：
     * - 如果 state.user 不存在（undefined）
     *   → 返回一个空用户对象，避免解构报错
     */
    const { username = '', nickname = '' } = useSelector<StateType, UserStateType>(
        state => state.user || { username: '', nickname: '' }
    );

    /**
     * 对外仅暴露必要字段
     * - 保持 API 简洁
     * - 避免组件直接依赖整个 user 对象
     */
    return { username, nickname };
}

export default useGetUserInfo;
