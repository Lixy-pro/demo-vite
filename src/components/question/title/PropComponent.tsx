import { useEffect, type FC } from 'react';
import { Checkbox, Form, Input, Select } from 'antd';

// Props 类型定义
import type { QuestionTitlePropsType } from './interface';

/**
 * 标题题型的属性配置面板
 *
 * 职责：
 * - 渲染 text / level / isCenter 的编辑表单
 * - 表单值变化时通过 onChange 回调通知父组件
 * - 接收外部 props 作为表单初始值，并在 props 变化时同步更新
 */
const PropComponent: FC<Partial<QuestionTitlePropsType>> = (
    props: Partial<QuestionTitlePropsType>
) => {
    // 解构 props，给默认值兜底
    const { text = '', level = 1, isCenter = false, onChange } = props;

    // 创建表单实例，用于手动控制表单值
    const [form] = Form.useForm();

    /**
     * 同步外部 props 到表单
     *
     * 触发时机：
     * - 组件首次挂载
     * - 切换选中组件时（新组件的配置写入表单）
     *
     * 为什么不用 initialValues 单独搞定：
     * - initialValues 只在首次渲染生效，切换组件后不更新
     * - 用 useEffect + setFieldsValue 才能在选中不同组件时刷新表单
     */
    useEffect(() => {
        form.setFieldsValue({ text, level, isCenter });
    }, [text, level, isCenter, form]);

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
            // initialValues 只保证首次渲染有值
            // 后续切换组件靠上面的 useEffect 同步
            initialValues={{ text, level, isCenter }}
        >
            <Form.Item
                label="标题内容"
                name="text"
                rules={[{ required: true, message: '请输入题内容' }]}
            >
                <Input />
            </Form.Item>
            <Form.Item label="层级" name="level">
                <Select
                    options={[
                        { value: 1, text: 1 },
                        { value: 2, text: 2 },
                        { value: 3, text: 3 },
                        { value: 4, text: 4 },
                        { value: 5, text: 5 },
                    ]}
                />
            </Form.Item>
            <Form.Item name="isCenter" valuePropName="checked">
                <Checkbox>局中显示</Checkbox>
            </Form.Item>
        </Form>
    );
};

export default PropComponent;
