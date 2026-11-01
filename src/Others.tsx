/**
 * Others 组件（演示版本）
 * 用于演示 React 的各种特性：ref 操作 DOM、自定义 Hook、styled-components、多选框、下拉框等
 */
// 引入 React 类型与常用 Hooks
import type { ChangeEvent, FC } from 'react';
import { useRef, useState } from 'react';

// 自定义 Hook，用于获取信息（通常是异步请求）
import useGetInfo from './hooks/useGetInfo';

// 引入 styled-components，用于组件级样式
import styled from 'styled-components';

/**
 * 自定义按钮组件
 * - 使用 styled-components 创建
 * - $primary 为 transient prop（不会传递到 DOM）
 * - 根据 $primary 决定按钮的主色样式
 */
const Button = styled.button<{ $primary?: boolean }>`
    background: ${props => (props.$primary ? 'palevioletred' : 'white')};
    color: ${props => (props.$primary ? 'white' : 'palevioletred')};
    font-size: 1em;
    padding: 0.25em 1em;
    border: 2px solid palevioletred;
    border-radius: 3px;
`;

/**
 * 容器组件
 * - 仅用于居中展示按钮
 */
const Container = styled.div`
    text-align: center;
`;

/**
 * Others 组件
 * 用于演示：
 * - ref 操作 DOM
 * - 自定义 Hook
 * - 样式组件
 * - 多选 checkbox
 * - select 下拉框
 */
const Others: FC = () => {
    /**
     * inputRef 用于获取 input DOM 元素
     * 通过 ref 可以手动操作 DOM（如选中文本）
     */
    const inputRef = useRef<HTMLInputElement>(null);

    /**
     * 自定义 Hook 返回的数据
     * loading: 是否加载中
     * info: 获取到的信息
     */
    const { loading, info } = useGetInfo();

    /**
     * 点击按钮时，选中 input 中的文本
     */
    function selectInput() {
        const inputElem = inputRef.current;
        if (inputElem) inputElem.select();
    }

    /**
     * 城市多选状态
     * selectCityList 存储当前选中的城市 value
     */
    const [selectCityList, setSelectCityList] = useState<string[]>([]);

    /**
     * checkbox 改变时的处理函数
     * - 如果已选中，则从数组中移除
     * - 如果未选中，则添加到数组中
     */
    function handleCityChange(event: ChangeEvent<HTMLInputElement>) {
        const city = event.target.value;

        if (selectCityList.includes(city)) {
            setSelectCityList(
                selectCityList.filter(c => {
                    if (c === city) return false;
                    return true;
                })
            );
        } else {
            setSelectCityList(selectCityList.concat(city));
        }
    }

    /**
     * 编程语言选择状态
     * 受控 select 组件
     */
    const [lang, setLang] = useState<string>('Java');

    /**
     * select 改变时的处理函数
     */
    function handleLangChange(event: ChangeEvent<HTMLSelectElement>) {
        setLang(event.target.value);
    }

    return (
        <div>
            {/* 区域 1：Ref 操作 DOM */}
            <h3>Other-1</h3>
            <input ref={inputRef} defaultValue="Hello world!" />
            &nbsp;
            <button onClick={selectInput}>Select input</button>
            <hr />
            {/* 区域 2：自定义 Hook 数据展示 */}
            <h3>Other-2</h3>
            <p>{loading ? '加载中...' : info}</p>
            <hr />
            {/* 区域 3：预留区域 */}
            <h3>Other-3</h3>
            <hr />
            {/* 区域 4：styled-components 按钮示例 */}
            <Container>
                <Button>Normal</Button>&nbsp;
                <Button $primary>Primary</Button>
            </Container>
            <hr />
            {/* 区域 5：城市多选 checkbox */}
            <>
                <label htmlFor="checkbox1">北京</label>
                <input
                    type="checkbox"
                    id="checkbox1"
                    value="beijing"
                    checked={selectCityList.includes('beijing')}
                    onChange={handleCityChange}
                />

                <label htmlFor="checkbox2">上海</label>
                <input
                    type="checkbox"
                    id="checkbox2"
                    value="shanghai"
                    checked={selectCityList.includes('shanghai')}
                    onChange={handleCityChange}
                />

                <label htmlFor="checkbox3">大连</label>
                <input
                    type="checkbox"
                    id="checkbox3"
                    value="dalian"
                    checked={selectCityList.includes('dalian')}
                    onChange={handleCityChange}
                />

                {/* 隐藏域，用于提交或调试选中的城市 */}
                <input type="hidden" name="cities" value={JSON.stringify(selectCityList)} />
            </>
            <hr />
            {/* 区域 6：受控 select 下拉框 */}
            <>
                <select value={lang} onChange={handleLangChange}>
                    <option value="java">Java</option>
                    <option value="js">JS</option>
                    <option value="python">Python</option>
                </select>
            </>
        </div>
    );
};

export default Others;
