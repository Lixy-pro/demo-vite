import type { FC } from 'react';
import './QCard.css';

// ts自定义类型
type PropsType = {
    id: string;
    title: string;
    isPublished: boolean;
    deleteQuestion?: (id: string) => void;
    publishQuestion?: (id: string) => void;
};

// FC - functional component
const QCard: FC<PropsType> = props => {
    const { id, title, isPublished, deleteQuestion, publishQuestion } = props;

    return (
        <div key={id} className="list-item">
            <strong>{title}</strong>&nbsp;
            {isPublished ? <span style={{ color: 'green' }}>已发布</span> : <span>未发布</span>}
            &nbsp;
            {publishQuestion && (
                <button
                    disabled={isPublished}
                    onClick={() => {
                        publishQuestion(id);
                    }}
                >
                    发布问卷
                </button>
            )}
            &nbsp;
            {deleteQuestion && (
                <button
                    onClick={() => {
                        deleteQuestion(id);
                    }}
                >
                    删除
                </button>
            )}
        </div>
    );
};

export default QCard;
