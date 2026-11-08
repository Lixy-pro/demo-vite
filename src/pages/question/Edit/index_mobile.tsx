import type { FC } from 'react';
import { useState } from 'react';
import classNames from 'classnames';
import useLoadQuestionData from '../../../hooks/useLoadQuestionData';
import styles from './index.module.scss';
import EditCanvas from './EditCanvas';

const Edit: FC = () => {
    const { loading, error } = useLoadQuestionData();

    // 抽屉开关：'left' | 'right' | null
    // 用「单值」而不是两个 boolean，保证同时只开一个
    const [drawer, setDrawer] = useState<'left' | 'right' | null>(null);

    const closeDrawer = () => setDrawer(null);
    const toggleDrawer = (k: 'left' | 'right') => setDrawer(prev => (prev === k ? null : k));

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>问卷编辑</div>
                <div style={{ padding: 24, color: '#ff4d4f' }}>
                    加载失败：{error.message || '请检查网络后重试'}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>问卷编辑</div>

            {/* 移动端操作条：仅在窄屏显示（CSS 控制） */}
            <div className={styles['mobile-bar']}>
                <button onClick={() => toggleDrawer('left')}>组件库</button>
                <button onClick={() => toggleDrawer('right')}>属性</button>
            </div>

            <div className={styles['content-wrapper']}>
                <div className={styles.content}>
                    {/* 抽屉打开时点遮罩关闭 */}
                    {drawer && <div className={styles['drawer-mask']} onClick={closeDrawer} />}

                    <div
                        className={classNames(styles.left, {
                            [styles['drawer-open']]: drawer === 'left',
                        })}
                    >
                        Left
                    </div>

                    <div className={styles.main}>
                        <div className={styles['canvas-wrapper']}>
                            <EditCanvas loading={loading} />
                        </div>
                    </div>

                    <div
                        className={classNames(styles.right, {
                            [styles['drawer-open']]: drawer === 'right',
                        })}
                    >
                        Right
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Edit;
