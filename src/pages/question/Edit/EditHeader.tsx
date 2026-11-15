/**
 * @description 编辑器顶部工具栏
 *
 * 承载编辑页的全局操作入口：
 * - 左侧：返回上一页 + 问卷标题（暂为静态文案，后续接 store 动态显示）
 * - 中间：预留操作区（如撤销/重做、设备切换等）
 * - 右侧：保存 / 发布
 *
 * 布局说明：
 * - 高度由 SCSS 的 $header-height 控制（当前 40px），
 *   与 Edit 页面内联样式的 40px 必须同步（两份真相）
 * - 宽度撑满视口，内部三栏左右贴边、中间自适应
 * - 窄屏下布局由 SCSS 媒体查询接管，本组件不判断视口
 */

import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography, Space } from 'antd';
import { LeftOutlined } from '@ant-design/icons';

import styles from './EditHeader.module.scss';

const { Title } = Typography;

const EditHeader: FC = () => {
    const nav = useNavigate();

    return (
        <div className={styles['header-wrapper']}>
            <div className={styles.header}>
                {/**
                 * 左侧：导航 + 标题
                 *
                 * 返回按钮：nav(-1) 回到上一页（问卷列表），
                 * 后续可改为弹窗确认，防止未保存离开
                 *
                 * 标题：当前是硬编码占位，
                 * TODO：从 store 读取问卷 title，支持就地编辑
                 */}
                <div className={styles.left}>
                    <Space>
                        <Button type="link" icon={<LeftOutlined />} onClick={() => nav(-1)}>
                            返回
                        </Button>
                        <Title>问卷标题</Title>
                    </Space>
                </div>

                {/**
                 * 中间：预留操作区
                 *
                 * TODO：可放置撤销/重做、预览切换、画布缩放比例等
                 */}
                <div className={styles.main}>中间</div>

                {/**
                 * 右侧：保存 + 发布
                 *
                 * 保存：写入后端草稿（TODO：接接口）
                 * 发布：切换问卷状态为「已发布」，禁止继续编辑（TODO：接接口）
                 */}
                <div className={styles.right}>
                    <Space>
                        <Button>保存</Button>
                        <Button type="primary">发布</Button>
                    </Space>
                </div>
            </div>
        </div>
    );
};

export default EditHeader;
