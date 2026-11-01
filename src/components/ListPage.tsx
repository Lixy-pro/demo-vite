import type { FC } from 'react';
// useState 用于维护当前页码和每页条数，useEffect 用于监听 URL 参数变化
// import { useEffect, useState } from 'react';
// 读取和修改 URL 查询参数、路由跳转、获取当前路径
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
// 引入 Ant Design 的分页组件
import { Pagination } from 'antd';
import type { PaginationProps } from 'antd';
// 引入分页相关的 URL 参数名常量和默认每页条数
import { LIST_PAGE_PARAM_KEY, LIST_PAGE_SIZE_PARAM_KEY, LIST_PAGE_SIZE } from '../constant';

type PropsType = {
    total: number; // 问卷总条数，由父组件传入
};

const ListPage: FC<PropsType> = (props: PropsType) => {
    const { total } = props;

    /*
    // 当前页码，默认第 1 页
    const [current, setCurrent] = useState(1);
    // 每页条数，默认取常量 LIST_PAGE_SIZE
    const [pageSize, setPageSize] = useState(LIST_PAGE_SIZE);
    */

    // 读取 URL 上的查询参数
    const [searchParams] = useSearchParams();

    // 从 URL 中读取页码，无效时回退为 1
    const page = parseInt(searchParams.get(LIST_PAGE_PARAM_KEY) || '') || 1;
    // 从 URL 中读取每页条数，无效时回退为默认值
    const pageSize = parseInt(searchParams.get(LIST_PAGE_SIZE_PARAM_KEY) || '') || LIST_PAGE_SIZE;

    /*
    // 当 URL 中的分页参数变化时，同步更新组件的页码和每页条数状态
    useEffect(() => {
        // 从 URL 中读取页码，无效时回退为 1
        const page = parseInt(searchParams.get(LIST_PAGE_PARAM_KEY) || '') || 1;
        // 从 URL 中读取每页条数，无效时回退为默认值
        const pageSize =
            parseInt(searchParams.get(LIST_PAGE_SIZE_PARAM_KEY) || '') || LIST_PAGE_SIZE;

        // 用 setTimeout 延后到下一轮事件循环再更新状态，
        // 避免在当前渲染周期内触发状态更新
        const timer = setTimeout(() => {
            setCurrent(page);
            setPageSize(pageSize);
        }, 0);

        // 组件卸载或依赖变化前，清除定时器
        return () => clearTimeout(timer);
    }, [searchParams]);
    */

    // 用于跳转路由，保持在同一页面并更新 URL 参数
    const nav = useNavigate();
    // 获取当前路径名，翻页时只改查询参数、不改路径
    const { pathname } = useLocation();

    // 页码或每页条数变化时触发
    const onChange: PaginationProps['onChange'] = (page, pageSize) => {
        // 把新的页码和每页条数写回 URL 查询参数
        searchParams.set(LIST_PAGE_PARAM_KEY, page.toString());
        searchParams.set(LIST_PAGE_SIZE_PARAM_KEY, pageSize.toString());

        // 跳转至更新后的 URL，实现分页状态可回溯（可刷新、可分享）
        nav({
            pathname,
            search: searchParams.toString(),
        });
    };

    return (
        <Pagination
            // 用 "页码-每页条数" 作为 key，URL 变化时分页器整体重建，避免受控组件在 current 突变时产生状态不一致
            key={`${page}-${pageSize}`} // ← URL 变了，分页器整体重建
            current={page} // 当前页码
            pageSize={pageSize} // 每页条数
            total={total} // 数据总条数
            hideOnSinglePage={true} // 只有一页时隐藏分页器
            align="center" // 分页器居中显示
            onChange={onChange} // 翻页或改变每页条数时的回调
        />
    );
};

export default ListPage;
