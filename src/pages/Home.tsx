/**
 * 首页组件
 * 展示产品介绍和统计数据，提供"开始使用"入口跳转至问卷管理页
 */
import { useEffect, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography } from 'antd';
import { MANAGE_INDEX_PATHNAME } from '../router';
import styles from './Home.module.scss';

// import '../_mock/index.ts';
import axios from 'axios';

const { Title, Paragraph } = Typography;

const Home: FC = () => {
    const nav = useNavigate();

    // 组件挂载时发起测试接口请求
    useEffect(() => {
        axios.get('/api/test').then(res => {
            console.log('axios res', res.data);
        });
    }, []);

    // 点击"开始使用"按钮，跳转至指定路径
    function clickHandler(path: string) {
        nav({
            pathname: path,
        });
    }

    return (
        <div className={styles.container}>
            <div className={styles.info}>
                <Title>问卷调查 ｜ 在线投票</Title>
                <Paragraph>已累计创建问卷 100 份，发布问卷 90 份，收到答卷 980 份</Paragraph>
                <div>
                    <Button type="primary" onClick={() => clickHandler(MANAGE_INDEX_PATHNAME)}>
                        开始使用
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Home;
