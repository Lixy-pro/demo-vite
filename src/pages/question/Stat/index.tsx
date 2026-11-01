/**
 * 问卷统计页面
 * 加载并展示问卷的统计数据，包括答卷数量、分布情况等
 */
import type { FC } from 'react';
import useLoadQuestionData from '../../../hooks/useLoadQuestionData';

const Stat: FC = () => {
    const { loading, data } = useLoadQuestionData();
    return (
        <div>
            <p>Stat page</p>
            {loading ? <p>loading</p> : <p>{JSON.stringify(data)}</p>}
        </div>
    );
};

export default Stat;
