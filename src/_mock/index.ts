/**
 * Mock 数据模块
 * 使用 mockjs 拦截前端请求，返回模拟数据，用于开发和测试阶段
 */
import Mock from 'mockjs';

/**
 * 拦截 GET /api/test 请求，返回模拟的测试数据
 * - errorCode: 状态码，0 表示成功
 * - data.name: 模拟的用户名，附带当前时间戳以区分不同请求
 */
Mock.mock('/api/test', 'get', () => {
    return {
        errorCode: 0,
        data: {
            name: `小李 ${Date.now()}`,
        },
    };
});
