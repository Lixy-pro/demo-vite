/**
 * 问卷列表组件（演示版本）
 * 使用 immer.js 简化不可变数据更新，演示问卷的增删改操作
 */
import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { produce } from 'immer';
import QCard from './components/QCard_cp';

const QList: FC = () => {
    useEffect(() => {
        console.log('加载 ajax 网络请求...');
    }, []);

    // 问卷列表数据
    const [questionList, setQuestionList] = useState([
        { id: 'q1', title: '问题1', isPublished: true },
        { id: 'q2', title: '问题2', isPublished: true },
        { id: 'q3', title: '问题3', isPublished: false },
        { id: 'q4', title: '问题4', isPublished: true },
    ]);

    // 生成唯一 ID
    const uid = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // 新增问卷
    function add() {
        // 使用 immer.js 简化数组追加操作
        setQuestionList(
            produce(draft => {
                draft.push({
                    id: 'q' + uid(),
                    title: '问卷' + uid(),
                    isPublished: false,
                });
            })
        );
    }

    // 发布问卷
    function publish(id: string) {
        // 使用 immer.js 简化对象属性修改
        setQuestionList(
            produce(draft => {
                const q = draft.find(item => item.id === id);
                if (q) q.isPublished = true;
            })
        );
    }

    // 删除问卷
    function del(id: string) {
        // 使用 immer.js 简化数组删除操作
        setQuestionList(
            produce(draft => {
                const index = draft.findIndex(q => q.id === id);
                draft.splice(index, 1);
            })
        );
    }
    return (
        <div>
            <h1>问卷列表页</h1>
            {/* 问卷列表 */}
            <div>
                {questionList.map(question => {
                    const { id, title, isPublished } = question;
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
            {/* 新增问卷按钮 */}
            <div>
                <button onClick={add}>新增问卷</button>
            </div>
        </div>
    );
};

export default QList;
