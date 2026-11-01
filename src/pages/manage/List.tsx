import type { FC } from 'react';
// useState 管理列表、总数、是否还有更多、是否已开始等渲染相关的状态；
// useEffect 用于关键字变化时重置状态、以及监听滚动；
// useMemo 缓存底部提示元素；useRef 保存不参与渲染的值（页码、关键字、容器节点）；
// useCallback 缓存加载下一页的回调，避免每次渲染都新建函数；
// queueMicrotask 把状态重置推迟到本次渲染提交后的微任务队列执行，
// 从而切断同步 setState 链，避免级联渲染（cascading renders）
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
// 读取 URL 中的搜索关键字
import { useSearchParams } from 'react-router-dom';
import QCard from '../../components/QCard';
import ListSearch from '../../components/ListSearch';
import { getQuestionListService } from '../../services/question';
import { LIST_PAGE_SIZE, LIST_SEARCH_PARAM_KEY } from '../../constant';
import styles from './common.module.scss';
import { Typography, Spin, Empty } from 'antd';
// useTitle 设置页面标题；useDebounceFn 对滚动和可见性检测做防抖；useRequest 管理列表请求
import { useTitle, useDebounceFn, useRequest } from 'ahooks';

/* 模拟的问卷列表数据（例）
const rawQuestionList = [
    {
        _id: 'q1',
        title: '问题1',
        isPublished: true,
        isStar: false,
        answerCount: 5,
        createdAt: '2026/1/1 13:30:30',
    }
]; */

// 解构出 Typography 的 Title 组件，用于渲染页面标题
const { Title } = Typography;

/**
 * 我的问卷列表页面
 * 展示用户创建的所有问卷，支持搜索和无限滚动加载
 */
const List: FC = () => {
    // 设置页面标题
    useTitle('小慕问卷 - 我的问卷');

    // 读取 URL 上的查询参数
    const [searchParams] = useSearchParams();
    // 从 URL 中读取搜索关键字，不存在则为空字符串
    const keyword = searchParams.get(LIST_SEARCH_PARAM_KEY) || '';

    // 累积的问卷列表（每一页追加到已有列表末尾，实现无限滚动）
    const [questionList, setQuestionList] = useState([]);
    // 问卷总条数，由接口返回，用于判断是否有更多数据
    const [total, setTotal] = useState(0);
    // 是否还有下一页可加载，控制滚动监听的注册和底部文案
    const [hasMore, setHasMore] = useState(false);
    // 是否已发起过首次加载：用来区分"还没开始加载"和"加载完了但没有数据"这两种无数据状态
    const [started, setStarted] = useState(false);

    // 当前页码：只被请求函数和加载逻辑读取，不参与渲染，所以放在 ref 里。
    // 改 ref 不会触发重渲染，符合 "ref 用于保存不参与渲染的值" 的定位
    const pageRef = useRef(1);
    // 当前生效的关键字快照：防止关键字切换后，之前还没返回的请求用旧关键字覆盖新列表
    const keywordRef = useRef(keyword);

    // 请求问卷列表（手动触发）
    const { loading, run: load } = useRequest(
        async () => {
            // 按当前页码、每页条数、关键字请求列表
            const data = await getQuestionListService({
                page: pageRef.current,
                pageSize: LIST_PAGE_SIZE,
                keyword: keywordRef.current,
            });
            return data;
        },
        {
            manual: true, // 不自动执行，需手动调用 load()
            onSuccess(result) {
                // 解构出本页列表和总数（t 避免和外层 total 重名）
                const { list = [], total: t = 0 } = result;

                // 用函数式更新：基于"最新的"列表做拼接，
                // 避免异步状态下读到过期的 questionList
                setQuestionList(prev => prev.concat(list));
                // 更新总条数
                setTotal(t);
                // 页码自增，准备下一次加载
                pageRef.current += 1;
                // 判断是否还有下一页：总数大于"当前已加载数 + 本页条数"
                setHasMore(t > questionList.length + list.length);
            },
        }
    );

    // 底部"加载更多"容器的 DOM 节点引用，用于检测它是否进入可视区
    const containerRef = useRef<HTMLDivElement>(null);

    // 加载下一页：只在"没在加载中"且"还有更多数据"时触发，防止一次滚动发起多个请求
    const loadNextPage = useCallback(() => {
        if (loading || !hasMore) return;
        setStarted(true);
        load();
    }, [loading, hasMore, load]);

    // 防抖后的"尝试加载更多"：检测容器是否出现在视口内
    const { run: tryLoadMore } = useDebounceFn(
        () => {
            const elem = containerRef.current;
            if (elem == null) return;

            // 获取容器在视口中的位置和尺寸
            const { top, bottom, left, right } = elem.getBoundingClientRect();
            // 判断容器是否与视口有交集：底部在视口下边缘之上、右侧在视口右边缘之左、
            // 顶部在视口高度之内、左侧在视口宽度之内
            if (bottom > 0 && right > 0 && top < window.innerHeight && left < window.innerWidth) {
                // 进入可视区：加载下一页
                loadNextPage();
            }
        },
        {
            wait: 500, // 500ms 内多次滚动只执行一次，避免频繁请求
        }
    );

    // 更新单条问卷的回调：按 _id 找到列表中对应的问卷并替换为新数据，
    // 用于在子组件（如 QCard）中编辑、标星、发布等操作后同步最新状态，
    // 避免整份列表重新请求。使用函数式更新，基于最新列表做替换
    const updateQuestion = newQ => {
        setQuestionList(prev => prev.map(q => (q._id === newQ._id ? newQ : q)));
    };

    // 关键字变化时：重置列表与页码，并立即加载第 1 页
    useEffect(() => {
        // 先记下本次关键字，让请求带着它发出
        keywordRef.current = keyword;
        // 页码回到第 1 页
        pageRef.current = 1;

        // 用 queueMicrotask 把状态重置和首次加载推迟到本次渲染提交后的微任务队列执行：
        // - 不在 effect 里同步连着调 setState，避免级联渲染告警
        // - 比 setTimeout（宏任务）更早执行，不会多等一个事件循环
        // - 不像 flushSync 那样强制同步刷新，不会阻塞浏览器
        queueMicrotask(() => {
            // 重置所有渲染相关状态
            setQuestionList([]);
            setTotal(0);
            setHasMore(false);
            setStarted(false);

            // 触发首次加载
            load();
            // 标记为已开始，让首次加载的 Spin 能显示出来
            setStarted(true);
        });
    }, [keyword, load]); // keyword 变化时重置并重新加载；load 由 useRequest 保持稳定

    // 当还有更多数据时，监听页面滚动以触发加载更多
    useEffect(() => {
        if (hasMore) {
            window.addEventListener('scroll', tryLoadMore);
        }
        // 卸载或依赖变化时，移除滚动监听，避免内存泄漏
        return () => {
            window.removeEventListener('scroll', tryLoadMore);
        };
    }, [hasMore, tryLoadMore]);

    // 底部提示元素：只依赖渲染相关的状态，不读取 ref.current，
    // 因此不会再在渲染期间访问 ref（符合 React 对 ref 的使用规则）
    const loadMoreContentElem = useMemo(() => {
        if (!started || loading) return <Spin />; // 加载中：显示转圈
        if (total === 0) return <Empty description="暂无数据" />; // 无数据
        if (!hasMore) return <span>没有更多了...</span>; // 已加载全部
        return <span>开始加载下一页</span>; // 还可继续加载
    }, [started, loading, hasMore, total]);

    return (
        <>
            {/* 页面头部：标题和搜索框 */}
            <div className={styles.header}>
                <div className={styles.left}>
                    <Title level={3}>我的问卷</Title>
                </div>
                <div className={styles.right}>
                    <ListSearch />
                </div>
            </div>
            {/* 问卷列表内容区：遍历渲染问卷卡片 */}
            <div className={styles.content}>
                {questionList.length > 0 &&
                    questionList
                        .filter(q => !q.isDeleted)
                        .map(q => <QCard key={q._id} {...q} updateQuestion={updateQuestion} />)}
            </div>
            {/* 分页加载提示 */}
            <div className={styles.footer}>
                {/* 底部提示区，绑定 ref 用于检测是否进入可视区 */}
                <div ref={containerRef}>{loadMoreContentElem}</div>
            </div>
        </>
    );
};

export default List;
