/**
 * 问卷卡片组件（简化版本）
 * 展示问卷标题、发布状态，提供发布和删除操作
 * 使用 classnames 库动态拼接 CSS 模块类名
 */
import type { FC } from 'react';
import { useEffect } from 'react';
// import './QCard.css';
import styles from './QCard_cp.module.scss';
import classNames from 'classnames';

// 问卷卡片的 props 类型定义
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

    // 组件挂载/卸载时的生命周期日志
    useEffect(() => {
        console.log('question card mounted.', id);

        return () => {
            console.log('question card unmounted.', id);
        };
    }, [id]);

    // 使用 classnames 动态组合类名，根据 isPublished 决定是否添加 published 样式
    const itemClassName = classNames({
        [styles['list-item']]: true,
        [styles.published]: isPublished,
    });

    return (
        <div key={id} className={itemClassName}>
            <strong>{title}</strong>&nbsp;
            {isPublished ? (
                <span className={styles['published-span']}>已发布</span>
            ) : (
                <span>未发布</span>
            )}
            &nbsp;
            {/* 发布问卷按钮，仅在传入 publishQuestion 回调时渲染 */}
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
            {/* 删除按钮，仅在传入 deleteQuestion 回调时渲染 */}
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
