/**
 * 问卷编辑页面
 * 加载并展示问卷数据，用于编辑问卷内容和配置
 */
import type { FC } from 'react';
import useLoadQuestionData from '../../../hooks/useLoadQuestionData';

const Edit: FC = () => {
    const { loading, data } = useLoadQuestionData();
    return (
        <div>
            <p>Edit page</p>
            {loading ? <p>loading</p> : <p>{JSON.stringify(data)}</p>}
        </div>
    );
};

export default Edit;
