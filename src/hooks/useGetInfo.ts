import { useState, useEffect } from 'react';

/**
 * 自定义 Hook：获取信息
 * 模拟异步请求，返回 loading 状态和获取到的数据
 */

/**
 * 模拟异步获取信息的函数
 * 延迟 1.5 秒后返回当前时间戳字符串
 */
function getInfo(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        // 1.5 秒后执行回调，模拟网络请求的延迟
        setTimeout(() => {
            try {
                // throw new Error('Promise has happened exception.');
                // 请求成功，返回当前时间戳字符串
                resolve(Date.now().toString());
            } catch (error) {
                // 捕获同步异常并转为失败结果
                reject('failed: ' + error);
            }
        }, 1500);
    });
}

/**
 * useGetInfo Hook
 * - loading: 是否正在加载中
 * - info: 获取到的信息字符串
 */
const useGetInfo = () => {
    // 加载状态，初始为 true（表示正在加载）
    const [loading, setLoading] = useState(true);
    // 存储获取到的信息，初始为空字符串
    const [info, setInfo] = useState('');

    // 组件挂载时触发一次异步请求
    useEffect(() => {
        getInfo().then(
            // 成功回调：结束加载并更新 info
            info => {
                setLoading(false);
                setInfo(info);
            },
            // 失败回调：结束加载并打印失败原因
            reason => {
                setLoading(false);
                console.log('处理失败:', reason);
            }
        );
        // 空依赖数组，只在挂载时执行一次
    }, []);

    return { loading, info };
};

export default useGetInfo;
