import type { FC } from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import styles from './FullscreenLoading.module.scss';

/**
 * FullscreenLoading - 全屏加载蒙层组件
 * 基于 Ant Design Spin 的 fullscreen 模式，自带半透明遮罩 + 居中转圈
 * 常用于页面级数据加载、路由切换、提交表单等场景
 */
const FullscreenLoading: FC<{ isLoading: boolean }> = ({ isLoading }) => {
    // 自定义加载指示器：使用 LoadingOutlined 替换默认转圈
    // 调整了字号和主题色，视觉上更突出
    const antIcon = (
        <LoadingOutlined
            style={{
                fontSize: 48, // 图标大小
                color: '#1677ff', // 主色调（Ant Design 品牌蓝）
            }}
            spin // 开启旋转动画
        />
    );

    return (
        <Spin
            spinning={isLoading} // 控制显隐：true 显示蒙层+loading，false 隐藏
            fullscreen // 全屏模式：position fixed 铺满视口，自带遮罩
            size="large" // 尺寸（配合自定义 indicator 时主要影响布局间距）
            indicator={antIcon} // 自定义加载图标
            description="加载中..." // 底部提示文字
            rootClassName={styles.spinWrapper} // 最外层 class，用于 CSS Modules 样式穿透
        />
    );
};

export default FullscreenLoading;
