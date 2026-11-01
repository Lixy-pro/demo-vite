/**
 * Others 组件（优化版本）
 * 使用类型定义和配置数组优化，代码更简洁易维护
 */
import type { ChangeEvent, FC } from 'react';
import { useRef, useState } from 'react';
import useGetInfo from './hooks/useGetInfo';
import styled from 'styled-components';

/**
 * 编程语言类型
 */
type Lang = 'java' | 'js' | 'python';

/**
 * 城市类型
 */
type City = 'beijing' | 'shanghai' | 'dalian';

/**
 * 城市配置（便于统一维护）
 */
const CITY_OPTIONS: { id: City; label: string }[] = [
    { id: 'beijing', label: '北京' },
    { id: 'shanghai', label: '上海' },
    { id: 'dalian', label: '大连' },
];

/**
 * 编程语言配置
 */
const LANG_OPTIONS: { value: Lang; label: string }[] = [
    { value: 'java', label: 'Java' },
    { value: 'js', label: 'JS' },
    { value: 'python', label: 'Python' },
];

/**
 * 按钮组件
 */
const Button = styled.button<{ $primary?: boolean }>`
    background: ${({ $primary }) => ($primary ? 'palevioletred' : 'white')};
    color: ${({ $primary }) => ($primary ? 'white' : 'palevioletred')};
    font-size: 1em;
    padding: 0.25em 1em;
    border: 2px solid palevioletred;
    border-radius: 3px;
`;

const Container = styled.div`
    text-align: center;
`;

/**
 * Others 组件
 */
const Others: FC = () => {
    /** input DOM 引用 */
    const inputRef = useRef<HTMLInputElement>(null);

    /** 自定义 Hook */
    const { loading, info } = useGetInfo();

    /**
     * 选中 input 文本
     */
    const selectInput = (): void => {
        inputRef.current?.select();
    };

    /** 已选城市 */
    const [selectCityList, setSelectCityList] = useState<City[]>([]);

    /**
     * checkbox 改变处理
     */
    const handleCityChange = (event: ChangeEvent<HTMLInputElement>): void => {
        const city = event.target.value as City;

        setSelectCityList(prev =>
            prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
        );
    };

    /** 当前语言 */
    const [lang, setLang] = useState<Lang>('java');

    /**
     * select 改变处理
     */
    const handleLangChange = (event: ChangeEvent<HTMLSelectElement>): void => {
        setLang(event.target.value as Lang);
    };

    return (
        <div>
            <h3>Other-1</h3>
            <input ref={inputRef} defaultValue="Hello world!" />
            &nbsp;
            <button onClick={selectInput}>Select input</button>
            <hr />
            <h3>Other-2</h3>
            <p>{loading ? '加载中...' : info}</p>
            <hr />
            <h3>Other-3</h3>
            <hr />
            <Container>
                <Button>Normal</Button>&nbsp;
                <Button $primary>Primary</Button>
            </Container>
            <hr />
            {/* 城市多选 */}
            <>
                {CITY_OPTIONS.map(({ id, label }) => (
                    <span key={id}>
                        <label htmlFor={id}>{label}</label>
                        <input
                            type="checkbox"
                            id={id}
                            value={id}
                            checked={selectCityList.includes(id)}
                            onChange={handleCityChange}
                        />
                    </span>
                ))}

                <input type="hidden" name="cities" value={JSON.stringify(selectCityList)} />
            </>
            <hr />
            {/* 语言选择 */}
            <>
                <select value={lang} onChange={handleLangChange}>
                    {LANG_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
            </>
        </div>
    );
};

export default Others;
