/**
 * 注册页面组件
 * 提供新用户注册表单，包含用户名、密码、确认密码、昵称等字段
 * 支持实时表单校验，校验通过后才可提交
 */

// React 相关类型与 Hooks
import type { FC } from 'react';
import { useEffect, useState } from 'react';

// 路由相关
import { Link, useNavigate } from 'react-router-dom';

// Ant Design 组件与类型
import type { FormProps } from 'antd';
import { Typography, Space, Form, Input, Button, message } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';

// 请求 Hook
import { useRequest } from 'ahooks';

// 样式与常量
import styles from './Register.module.scss';
import { LOGIN_PATHNAME } from '../router';

// 用户相关服务
import { registerUserInfoService } from '../services/user';

/**
 * 注册表单字段类型
 */
type FieldType = {
    /** 用户名 */
    username: string;

    /** 密码 */
    password: string;

    /** 确认密码 */
    confirmPWD: string;

    /** 用户昵称（可选） */
    nickname: string;
};

// 解构 Typography 组件，用于标题展示
const { Title } = Typography;

/**
 * 注册页面组件
 */
const Register: FC = () => {
    // 路由跳转实例
    const nav = useNavigate();

    // Ant Design Form 实例，用于控制和校验表单
    const [form] = Form.useForm();

    // 表单是否可提交（所有校验规则通过时为 true）
    const [submittable, setSubmittable] = useState(false);

    /**
     * 监听表单中所有字段的值变化
     * 每次变化后触发校验逻辑
     */
    const values = Form.useWatch([], form);

    /**
     * 根据表单值实时校验是否允许提交
     * - 校验通过：启用提交按钮
     * - 校验失败：禁用提交按钮，并打印错误字段
     */
    useEffect(() => {
        form.validateFields({ validateOnly: true })
            .then(() => setSubmittable(true))
            .catch(err => {
                console.error('校验未通过字段:', err.errorFields);
                setSubmittable(false);
            });
    }, [values, form]);

    /**
     * 注册请求逻辑
     * manual: true 表示不自动执行，需要手动调用 run
     */
    const { loading, run } = useRequest(
        async (values: FieldType) => {
            const { username, password, nickname } = values;

            // 调用注册接口
            await registerUserInfoService(username!, password!, nickname);
        },
        {
            manual: true,

            // 注册成功后的回调
            onSuccess() {
                message.success('注册成功');

                // 跳转到登录页
                nav(LOGIN_PATHNAME);
            },
        }
    );

    /**
     * 表单提交成功回调
     * @param values - 校验通过的表单数据
     */
    const onFinish: FormProps<FieldType>['onFinish'] = values => {
        run(values);
    };

    return (
        <div className={styles.container}>
            {/* 页面标题区域 */}
            <div>
                <Space>
                    <Title level={2}>
                        <UserAddOutlined />
                    </Title>
                    <Title level={2}>注册新用户</Title>
                </Space>
            </div>

            {/* 注册表单区域 */}
            <div>
                <Form
                    name="basic"
                    labelCol={{ span: 6 }}
                    wrapperCol={{ span: 16 }}
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

                    {/* 确认密码输入框 */}
                    {/* 通过 dependencies 监听 password，实现两次密码一致性校验 */}
                    <Form.Item<FieldType>
                        label="确认密码"
                        name="confirmPWD"
                        dependencies={['password']}
                        rules={[
                            { required: true, message: '请输入确认密码' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('两次密码不一致'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password placeholder="确认密码" />
                    </Form.Item>

                    {/* 昵称输入框（可选） */}
                    <Form.Item<FieldType> label="昵称" name="nickname">
                        <Input placeholder="昵称" />
                    </Form.Item>

                    {/* 提交按钮与登录跳转链接 */}
                    <Form.Item label={null} wrapperCol={{ offset: 6, span: 16 }}>
                        <Space>
                            {/* 
                                提交按钮：
                                - 表单校验未通过或正在请求时禁用
                            */}
                            <Button
                                type="primary"
                                htmlType="submit"
                                disabled={!submittable || loading}
                            >
                                注册
                            </Button>

                            {/* 跳转到登录页 */}
                            <Link to={LOGIN_PATHNAME}>已有账户，请登录</Link>
                        </Space>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
};

export default Register;
