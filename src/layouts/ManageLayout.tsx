/**
 * 问卷管理布局组件
 * 左侧为操作菜单（新建问卷、我的问卷、星标问卷、回收站），右侧为子路由内容区
 */
import type { FC } from 'react';
// import { useState } from 'react';
import { useRequest } from 'ahooks';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import styles from './ManageLayout.module.scss';
import { Button, Space, Divider, message } from 'antd';
import { PlusOutlined, BarsOutlined, StarOutlined, DeleteOutlined } from '@ant-design/icons';
import { createQuestionService } from '../services/question';

const ManageLayout: FC = () => {
    const nav = useNavigate();
    const { pathname } = useLocation();

    // 使用 useRequest 管理新建问卷的异步请求，manual: true 表示手动触发
    const { loading, run: handleCreateClick } = useRequest(createQuestionService, {
        manual: true,
        onSuccess(result) {
            nav(`/question/edit/${result.id}`);
            message.success('创建成功！');
        },
        onError(error) {
            message.error('创建失败，请稍后再试！');
            console.error('创建失败，请稍后再试！', error);
        },
    });

    return (
        <div className={styles.container}>
            {/* 左侧菜单栏 */}
            <div className={styles.left}>
                <Space orientation="vertical" size="small" style={{ display: 'flex' }}>
                    {/* 新建问卷按钮 */}
                    <Button
                        type="primary"
                        size="large"
                        icon={<PlusOutlined />}
                        onClick={handleCreateClick}
                        disabled={loading}
                    >
                        新建问卷
                    </Button>
                    <Divider size="medium" style={{ borderTop: 'transparent' }} />
                    {/* 导航按钮：根据当前路径高亮对应按钮 */}
                    <Button
                        type={pathname.startsWith('/manage/list') ? 'default' : 'text'}
                        size="large"
                        icon={<BarsOutlined />}
                        onClick={() => {
                            nav('/manage/list');
                        }}
                    >
                        我的问卷
                    </Button>
                    <Button
                        type={pathname.startsWith('/manage/star') ? 'default' : 'text'}
                        size="large"
                        icon={<StarOutlined />}
                        onClick={() => {
                            nav('/manage/star');
                        }}
                    >
                        星标问卷
                    </Button>
                    <Button
                        type={pathname.startsWith('/manage/trash') ? 'default' : 'text'}
                        size="large"
                        icon={<DeleteOutlined />}
                        onClick={() => {
                            nav('/manage/trash');
                        }}
                    >
                        回收站
                    </Button>
                </Space>
            </div>
            {/* 右侧内容区：渲染子路由 */}
            <div className={styles.right}>
                <Outlet />
            </div>
        </div>
    );
};

export default ManageLayout;
