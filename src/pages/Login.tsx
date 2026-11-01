/**
 * 登录页面组件
 * - 提供用户名、密码登录表单
 * - 支持表单实时校验
 * - 支持“记住我”功能（通过 localStorage 持久化用户名和密码）
 */

// React 相关
import type { FC } from 'react';
import { useEffect, useState } from 'react';

// 路由相关
import { useNavigate, Link } from 'react-router-dom';

// 样式
import styles from './Login.module.scss';

// Ant Design 组件与类型
import type { FormProps } from 'antd';
import { Typography, Space, Form, Input, Button, Checkbox, message } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';

// 请求 Hook
import { useRequest } from 'ahooks';

// 路由常量
import { REGISTER_PATHNAME, MANAGE_INDEX_PATHNAME } from '../router';

// 用户服务
import { loginUserInfoService } from '../services/user';

// Token 工具方法
import { setToken } from '../utils/user-token';

/**
 * 登录表单字段类型
 * 注：部分字段为复用注册表单结构，当前登录页仅使用 username / password / remember
 */
type FieldType = {
    /** 用户名 */
    username: string;

    /** 密码 */
    password: string;

    /** 是否记住用户 */
    remember: boolean;
};

// 解构标题组件
const { Title } = Typography;

// localStorage 存储 Key
const USERNAME_KEY = 'xm_username';
const PASSWORD_KEY = 'xm_password';

/**
 * 记住用户信息
 * 将用户名和密码持久化到 localStorage
 */
function rememberUser(username: string, password: string) {
    localStorage.setItem(USERNAME_KEY, username);
    localStorage.setItem(PASSWORD_KEY, password);
}

/**
 * 删除本地保存的用户信息
 * 用于取消“记住我”或退出登录
 */
function deleteUserFromStorage() {
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(PASSWORD_KEY);
}

/**
 * 从 localStorage 中读取用户信息
 * 用于页面初始化时回填表单
 */
function getUserInfoFromStorage() {
    return {
        username: localStorage.getItem(USERNAME_KEY) || '',
        password: localStorage.getItem(PASSWORD_KEY) || '',
    };
}

/**
 * 登录页面组件
 */
const Login: FC = () => {
    // 路由跳转
    const nav = useNavigate();

    // Ant Design Form 实例
    const [form] = Form.useForm();

    // 表单是否可提交（校验通过时为 true）
    const [submittable, setSubmittable] = useState(false);

    // 从 localStorage 中获取已保存的用户信息
    const { username, password } = getUserInfoFromStorage();

    /**
     * 监听表单所有字段变化
     * 用于触发实时校验逻辑
     */
    const values = Form.useWatch([], form);

    /**
     * 实时校验表单是否可提交
     * 使用 setTimeout 确保在表单状态更新后执行
     */
    useEffect(() => {
        const timer = setTimeout(() => {
            form.validateFields({ validateOnly: true })
                .then(() => setSubmittable(true))
                .catch(err => {
                    console.error('校验未通过字段:', err.errorFields);
                    setSubmittable(false);
                });
        }, 0);

        return () => clearTimeout(timer);
    }, [values, form]);

    /**
     * 登录请求逻辑
     * manual: true —— 手动触发，不直接执行
     */
    const { loading, run } = useRequest(
        async (username: string, password: string) => {
            // 调用登录接口
            const data = await loginUserInfoService(username, password);
            return data;
        },
        {
            manual: true,

            // 登录成功回调
            onSuccess(result) {
                const { token = '' } = result;

                // 保存用户 Token
                setToken(token);

                // 根据“记住我”状态处理本地用户信息
                const { username, password, remember } = values || {};
                if (remember) {
                    rememberUser(username!, password!);
                } else {
                    deleteUserFromStorage();
                }

                message.success('登录成功');

                // 跳转到管理后台首页
                nav(MANAGE_INDEX_PATHNAME);
            },
        }
    );

    /**
     * 表单提交成功回调
     * @param values - 校验通过的表单数据
     */
    const onFinish: FormProps<FieldType>['onFinish'] = values => {
        const { username, password } = values || {};
        run(username!, password!);
    };

    return (
        <div className={styles.container}>
            {/* 页面标题 */}
            <div>
                <Space>
                    <Title level={2}>
                        <UserAddOutlined />
                    </Title>
                    <Title level={2}>用户登录</Title>
                </Space>
            </div>

            {/* 登录表单 */}
            <div>
                <Form
                    name="basic"
                    labelCol={{ span: 6 }}
                    wrapperCol={{ span: 16 }}
                    // 初始化表单值（若有本地缓存则自动回填）
                    initialValues={{ username, password, remember: false }}
                    onFinish={onFinish}
                    form={form}
                >
                    {/* 用户名输入框 */}
                    <Form.Item<FieldType>
                        label="用户名"
                        name="username"
                        rules={[
                            { required: true, message: '请输入用户名' },
                            {
                                type: 'string',
                                min: 6,
                                max: 20,
                                message: '字符长度在 6-20 之间',
                            },
                            { pattern: /^\w+$/, message: '只能是字母、数字和下划线' },
                        ]}
                    >
                        <Input placeholder="用户名" />
                    </Form.Item>

                    {/* 密码输入框 */}
                    <Form.Item<FieldType>
                        label="密码"
                        name="password"
                        rules={[
                            { required: true, message: '请输入密码' },
                            {
                                type: 'string',
                                min: 8,
                                max: 20,
                                message: '字符长度在 8-20 之间',
                            },
                            {
                                pattern:
                                    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[\x21-\x2F\x3A-\x40\x5B-\x60\x7B-\x7E]).+$/,
                                message: '必须包含字母、数字和英文特殊字符',
                            },
                        ]}
                    >
                        <Input.Password placeholder="密码" />
                    </Form.Item>

                    {/* 记住我 */}
                    <Form.Item
                        label={null}
                        name="remember"
                        valuePropName="checked"
                        wrapperCol={{ offset: 6, span: 16 }}
                    >
                        <Checkbox>记住我</Checkbox>
                    </Form.Item>

                    {/* 登录按钮 & 注册入口 */}
                    <Form.Item label={null} wrapperCol={{ offset: 6, span: 16 }}>
                        <Space>
                            {/* 
                                登录按钮：
                                - 表单校验未通过时禁用
                            */}
                            <Button
                                type="primary"
                                htmlType="submit"
                                disabled={!submittable || loading}
                            >
                                登录
                            </Button>

                            {/* 跳转注册页 */}
                            <Link to={REGISTER_PATHNAME}>注册新用户</Link>
                        </Space>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
};

export default Login;
