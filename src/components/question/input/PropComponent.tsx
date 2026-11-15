import { useEffect, type FC } from 'react';
import { Form, Input } from 'antd';

// Props 类型定义
import type { QuestionInputPropsType } from './interface';

/**
 * 输入框题型的属性配置面板
 *
 * 职责：
 * - 渲染标题和 placeholder 的编辑表单
 * - 表单值变化时通过 onChange 回调通知父组件（右侧属性面板）
 * - 接收外部 props 作为表单初始值，并在 props 变化时同步更新
 */
const PropComponent: FC<Partial<QuestionInputPropsType>> = (
    props: Partial<QuestionInputPropsType>
) => {
    // 解构 props，给默认值兜底
    const { title = '', placeholder = '', onChange } = props;

    // 创建表单实例，用于手动控制表单值
    const [form] = Form.useForm();

    /**
     * 同步外部 props 到表单
     *
     * 触发时机：
     * - 组件首次挂载（props 初始化）
     * - 切换选中组件时（props 变化，新组件的配置写入表单）
     *
     * 为什么用 useEffect 而不是 initialValues：
     * - initialValues 只在首次渲染时生效，切换组件后不会更新
     * - 用 useEffect + setFieldsValue 才能在选中不同组件时刷新表单
     */
    useEffect(() => {
        form.setFieldsValue({ title, placeholder });
    }, [title, placeholder, form]);

    /**
     * 表单值变化时的回调
     *
     * 把表单当前值通过 onChange 回传给父组件，
     * 父组件再 dispatch 更新 store 里对应组件的 props
     */
    function handleValueChange() {
        if (onChange) {
            onChange(form.getFieldsValue());
        }
    }

    return (
        <Form
            layout="vertical"
            onValuesChange={handleValueChange}
            form={form}
            // 注意：initialValues 只保证首次渲染有值
            // 后续切换组件靠上面的 useEffect 同步
            initialValues={{ title, placeholder }}
        >
            <Form.Item
                label="标题"
                name="title"
                rules={[{ required: true, message: '请输入标题' }]}
            >
                <Input />
            </Form.Item>
            <Form.Item label="Placeholder" name="placeholder">
                <Input />
            </Form.Item>
        </Form>
    );
};

export default PropComponent;
