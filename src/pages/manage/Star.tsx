/**
 * @description 星标问卷页面
 *
 * ── 职责 ──
 * 展示用户标记为星标的问卷列表，支持搜索、分页、单条操作（编辑/标星/删除）。
 *
 * ── 数据流 ──
 * URL 参数（keyword / page / pageSize）
 *   → useLoadQuestionListData({ isStar: true }) 请求列表
 *   → data.list 同步到本地 questionList（避免子组件操作触发整页重请求）
 *   → QCard 通过 updateQuestion 只更新列表中对应的那一条
 *
 * ── 为什么需要本地 questionList ──
 * - Hook 返回的 data.list 是每次请求的全量快照
 * - 子组件（QCard）中标星/取消标星/删除等操作只需改一条数据
 * - 如果直接基于 data.list 渲染，子组件操作后必须重新请求整个列表才能刷新
 * - 维护本地副本 → 子组件操作后只更新对应项，列表即时响应，无需重新请求
 */

import type { FC } from 'react';
import { useEffect, useState } from 'react';

// 问卷卡片：展示信息 + 提供编辑/标星/复制/删除操作
import type { QuestionType } from '../../components/QCard';
import QCard from '../../components/QCard';
// 搜索框：关键字写入 URL 查询参数，触发列表重新请求
import ListSearch from '../../components/ListSearch';
// 列表数据加载 Hook：从 URL 读参数，请求问卷列表
import useLoadQuestionListData from '../../hooks/useLoadQuestionListData';
// 分页器：页码/每页条数写入 URL
import ListPage from '../../components/ListPage';
// 公共布局样式
import styles from './common.module.scss';

import { Typography, Empty } from 'antd';
import { useTitle } from 'ahooks';

import Loading from '../../components/FullscreenLoading';

const { Title } = Typography;

const Star: FC = () => {
    // 设置浏览器标签页标题
    useTitle('小慕问卷 - 星标问卷');

    /**
     * 加载星标问卷列表
     *
     * isStar: true → 服务端只返回标星问卷
     * 搜索关键字 / 页码 / 每页条数由 Hook 内部从 URL 读取
     */
    const { loading, data = {} } = useLoadQuestionListData({ isStar: true });
    const { list = [], total = 0 } = data;

    /**
     * 本地问卷列表状态
     *
     * 初始化为空数组，等首次请求返回后同步
     * 子组件操作（标星/删除）后只改这一份，不重新请求
     */
    const [questionList, setQuestionList] = useState<QuestionType[]>([]);

    /**
     * 接口数据到达后同步到本地状态
     *
     * 依赖 loading + data + list：
     * - loading 变为 false 说明请求完成，此时 list 是最新快照
     * - 用 queueMicrotask 把 setState 推迟到微任务队列，
     *   避免 effect 中同步 setState 触发 React 级联渲染告警
     */
    useEffect(() => {
        if (!loading) {
            queueMicrotask(() => {
                setQuestionList(list);
            });
        }
    }, [loading, data, list]);

    /**
     * 更新单条问卷
     *
     * 由 QCard 在操作完成后调用：
     * - 取消标星 / 移入回收站 → 从列表中移除该条
     * - 编辑标题等其他操作 → 原地替换该条
     *
     * 使用函数式更新，基于最新列表做替换
     */
    const updateQuestion = (newQ: QuestionType) => {
        setQuestionList(prev =>
            !newQ.isStar || newQ.isDeleted
                ? prev.filter(q => q._id !== newQ._id)
                : prev.map(q => (q._id === newQ._id ? newQ : q))
        );
    };

    return (
        <>
            {/* 页面头部：标题 + 搜索框 */}
            <div className={styles.header}>
                <div className={styles.left}>
                    <Title level={3}>星标问卷</Title>
                </div>
                <div className={styles.right}>
                    <ListSearch />
                </div>
            </div>

            {/* 问卷列表内容区 */}
            <div className={styles.content}>
                {/* 加载中 */}
                <Loading isLoading={loading} />

                {/* 加载完成，无数据 */}
                {!loading && questionList.length === 0 && (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
                )}

                {/* 加载完成，有数据：遍历渲染卡片 */}
                {!loading &&
                    questionList.length > 0 &&
                    questionList.map((q: QuestionType) => {
                        const { _id } = q;
                        return <QCard key={_id} {...q} updateQuestion={updateQuestion} />;
                    })}
            </div>

            {/* 分页器：total 决定总页数，翻页触发 URL 变化 → 列表重新请求 */}
            <div className={styles.footer}>
                <ListPage total={total} />
            </div>
        </>
    );
};

export default Star;
