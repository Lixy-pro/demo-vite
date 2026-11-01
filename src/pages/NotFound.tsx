/**
 * 404 页面组件
 * 当用户访问不存在的路由时展示，提供返回首页按钮
 */
import type { FC } from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { MANAGE_INDEX_PATHNAME } from '../router';

const NotFound: FC = () => {
    const nav = useNavigate();

    return (
        <Result
            status="404"
            title="404"
            subTitle="Sorry, the page you visited does not exist."
            extra={
                <Button
                    type="primary"
                    onClick={() => {
                        nav(MANAGE_INDEX_PATHNAME);
                    }}
                >
                    Back Home
                </Button>
            }
        />
    );
};

export default NotFound;
