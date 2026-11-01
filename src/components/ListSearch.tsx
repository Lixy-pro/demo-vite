/**
 * 列表搜索组件
 * 提供关键字搜索功能，搜索关键字通过 URL query 参数传递，实现与路由的联动
 */
import type { ChangeEvent, FC } from 'react';
import { useState, useEffect } from 'react';
import { Input } from 'antd';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { LIST_SEARCH_PARAM_KEY } from '../constant';

const { Search } = Input;

const ListSearch: FC = () => {
    const nav = useNavigate();
    const { pathname } = useLocation();
    // 搜索框的受控值
    const [value, setValue] = useState('');

    const [searchParams] = useSearchParams();
    // 从 URL 参数同步搜索关键字到输入框
    useEffect(() => {
        const curValue = searchParams.get(LIST_SEARCH_PARAM_KEY) || '';
        const timer = setTimeout(() => {
            setValue(curValue);
        }, 0);
        return () => clearTimeout(timer);
    }, [searchParams]);

    // 输入框内容变化时更新 state
    function handleLChange(event: ChangeEvent<HTMLInputElement>) {
        setValue(event.target.value);
    }

    // 触发搜索时，将关键字写入 URL query 参数
    function handleLSearch(value: string) {
        nav({
            pathname,
            search: `${LIST_SEARCH_PARAM_KEY}=${value}`,
        });
    }
    return (
        <>
            <Search
                placeholder="输入关键字"
                value={value}
                allowClear
                onSearch={handleLSearch}
                onChange={handleLChange}
                size="large"
                style={{ width: '200px' }}
            />
        </>
    );
};

export default ListSearch;
