/**
 * Logo 组件
 * 展示应用图标与名称，点击可跳转至首页
 */
import type { FC } from 'react';
import { Space, Typography } from 'antd';
import { FormOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import styles from './Logo.module.scss';

const { Title } = Typography;

const Logo: FC = () => {
    return (
        <div className={styles.container}>
            <Link to={'/'}>
                <Space>
                    <Title>
                        <FormOutlined />
                    </Title>
                    <Title>小慕问卷</Title>
                </Space>
            </Link>
        </div>
    );
};

export default Logo;
