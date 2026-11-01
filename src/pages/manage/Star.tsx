/**
 * 星标问卷页面
 * 展示用户标记为星标的问卷列表
 *
 * 功能说明：
 * - 只加载 isStar = true 的问卷
 * - 支持通过搜索框按关键字过滤
 * - 支持分页（页码和每页条数保存在 URL 上）
 * - 子组件 QCard 编辑、标星、删除等操作后，只更新列表中对应的那一条
 */

// React 函数组件类型
import type { FC } from 'react';
// useState 用于维护本页的问卷列表状态；
// useEffect 用于在接口返回的列表变化时同步到本地状态
import { useEffect, useState } from 'react';

// 单个问卷卡片组件：展示问卷信息并提供编辑、标星、复制、删除等操作
import QCard from '../../components/QCard';
// 列表页顶部的搜索框，搜索关键字写入 URL 查询参数
import ListSearch from '../../components/ListSearch';
// 自定义 Hook：根据筛选条件请求问卷列表，返回列表数据、总数和加载状态
import useLoadQuestionListData from '../../hooks/useLoadQuestionListData';
// 分页器组件：页码和每页条数写入 URL，支持刷新和分享
import ListPage from '../../components/ListPage';
// 本页面公共样式（header / content / footer 布局）
import styles from './common.module.scss';
// Ant Design 组件：
// Typography.Title  页面标题
// Empty             空状态提示
// Spin              加载动画
import { Typography, Empty, Spin } from 'antd';
// ahooks：useTitle 用于设置浏览器标签页标题
import { useTitle } from 'ahooks';

/* 模拟的星标问卷数据（例）
const rawQuestionList = [
    {
        _id: 'q1',
        title: '问题1',
        isPublished: true,
        isStar: true,
        answerCount: 5,
        createdAt: '2026/1/1 13:30:30',
    }
];*/

// 解构出 Typography 的 Title 组件，用于渲染页面标题
const { Title } = Typography;

const Star: FC = () => {
    // const [questionList] = useState(rawQuestionList);

    // 设置浏览器标签页标题
    useTitle('小慕问卷 - 星标问卷');

    // 调用自定义 Hook 加载问卷列表：
    // - isStar: true 表示只查星标问卷，筛选在服务端完成
    // - 搜索关键字、页码、每页条数由 Hook 内部从 URL 读取
    // - loading 表示是否正在请求
    // - data 包含 list（本页列表）和 total（符合条件的问卷总数）
    const { loading, data = {} } = useLoadQuestionListData({ isStar: true });

    // 从返回数据中解构出列表数组和总数，并提供默认值：
    // - list  本页的问卷数据
    // - total 星标问卷的总数，传给分页器计算总页数
    const { list = [], total = 0 } = data;

    // 本页维护的问卷列表状态，用于：
    // 1. 接收到接口数据后存一份本地副本
    // 2. QCard 通过 updateQuestion 只更新其中一条，不用重新请求整个列表
    const [questionList, setQuestionList] = useState([]);

    // 当接口返回的 list 变化时（切换页码、搜索、标星状态改变），
    // 把最新列表同步到本地状态
    useEffect(() => {
        // 防御性判断：确保 list 是数组，避免接口异常时传入非法值
        if (Array.isArray(list)) {
            // 用 queueMicrotask 把状态更新推迟到本次渲染提交后的微任务队列执行，
            // 避免在 effect 中同步连着 setState 触发级联渲染告警
            queueMicrotask(() => {
                setQuestionList(list);
            });
        }
    }, [list]); // 只在 list 引用变化时同步

    // 更新单条问卷的回调：按 _id 找到列表中对应的问卷并替换为新数据，
    // 用于在子组件（如 QCard）中编辑、标星、发布等操作后同步最新状态，
    // 避免整份列表重新请求。使用函数式更新，基于最新列表做替换
    const updateQuestion = newQ => {
        setQuestionList(prev =>
            !newQ.isStar || newQ.isDeleted
                ? prev.filter(q => q._id !== newQ._id)
                : prev.map(q => (q._id === newQ._id ? newQ : q))
        );
    };

    return (
        <>
            {/* 页面头部：标题和搜索框 */}
            <div className={styles.header}>
                <div className={styles.left}>
                    <Title level={3}>星标问卷</Title>
                </div>
                <div className={styles.right}>
                    {/* 搜索框：输入后关键字写入 URL，会触发列表重新请求 */}
                    <ListSearch />
                </div>
            </div>

            {/* 问卷列表内容区 */}
            <div className={styles.content}>
                {/* 加载中：居中显示 Spin 加载动画 */}
                {loading && (
                    <div style={{ textAlign: 'center' }}>
                        <Spin />
                    </div>
                )}

                {/* 加载完成且无数据：显示空状态提示 */}
                {!loading && questionList.length === 0 && (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
                )}

                {/* 加载完成且有数据：遍历渲染问卷卡片 */}
                {!loading &&
                    questionList.length > 0 &&
                    questionList.map(q => {
                        // 取出问卷 id 作为列表项的唯一 key
                        const { _id } = q;
                        return (
                            // 把问卷字段展开传入，并传入更新回调
                            <QCard key={_id} {...q} updateQuestion={updateQuestion} />
                        );
                    })}
            </div>

            {/* 分页区域 */}
            <div className={styles.footer}>
                {/* 
                    分页器：
                    - total 决定总页数
                    - 页码和每页条数写在 URL 上，翻页后会触发上面的 Hook 重新请求
                */}
                <ListPage total={total} />
            </div>
        </>
    );
};

export default Star;
