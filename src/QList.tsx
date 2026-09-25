import type { FC } from 'react';
import { useState } from 'react';
import QCard from './commponts/QCard';

const QList: FC = () => {
    // 问卷列表数据
    const [questionList, setQuestionList] = useState([
        { id: 'q1', title: '问题1', isPublished: true },
        { id: 'q2', title: '问题2', isPublished: true },
        { id: 'q3', title: '问题3', isPublished: false },
        { id: 'q4', title: '问题4', isPublished: true },
    ]);

    // 生产随机数
    const uid = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // 新增问卷
    function add() {
        setQuestionList(
            questionList.concat({
                id: 'q' + uid(),
                title: '问卷' + uid(),
                isPublished: false,
            })
        );
    }

    // 发布问卷
    function publish(id: string) {
        setQuestionList(
            questionList.map(q => {
                if (q.id !== id) {
                    return q;
                }
                return {
                    ...q,
                    isPublished: true,
                };
            })
        );
    }

    // 删除问卷
    function del(id: string) {
        setQuestionList(
            questionList.filter(q => {
                if (q.id === id) {
                    return false;
                }
                return true;
            })
        );
    }
    return (
        <div>
            <h1>问卷列表页</h1>
            <div>
                {questionList.map(question => {
                    const { id, title, isPublished } = question;
                    // return <QCard key={id} {...question} />;
                    return (
                        <QCard
                            key={id}
                            id={id}
                            title={title}
                            isPublished={isPublished}
                            deleteQuestion={del}
                            publishQuestion={publish}
                        />
                    );
                })}
            </div>
            <div>
                <button onClick={add}>新增问卷</button>
            </div>
        </div>
    );
};

export default QList;
