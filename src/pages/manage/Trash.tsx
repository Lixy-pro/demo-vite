/**
 * 回收站页面
 * 展示已删除的问卷列表，支持批量恢复和彻底删除操作
 *
 * 功能说明：
 * - 只加载 isDeleted = true 的问卷（筛选在服务端完成）
 * - 支持通过搜索框按关键字过滤
 * - 支持 checkbox 多选，对选中的问卷执行：
 *    1. 批量恢复（把 isDeleted 改回 false）
 *    2. 批量彻底删除（物理删除，不可恢复）
 * - 操作成功后刷新列表并清空选中项
 * - 页码和每页条数保存在 URL 上，由 ListPage 负责展示
 */

// React 函数组件类型
import type { FC } from 'react';
// useState 用于维护：选择类型、当前选中的问卷 ID 列表、Modal 实例
import { useState } from 'react';

// 页面公共样式（header / content / footer 布局）
import styles from './common.module.scss';

// 引入 Ant Design 组件：
// Typography  页面标题
// Empty      空状态提示
// Table      数据表格
// Tag        状态标签
// Button     操作按钮
// Space      水平排列子元素
// Modal      命令式确认弹窗
// message    全局提示
// Spin       加载动画
import { Typography, Empty, Table, Tag, Button, Space, Modal, message, Spin } from 'antd';

// 引入 Table 的列配置类型和行选择（rowSelection）属性类型
import type { TableColumnsType, TableProps } from 'antd';

// 警告图标，用于删除确认弹窗
import { ExclamationCircleOutlined } from '@ant-design/icons';

// 列表页顶部搜索框：输入的关键字会写入 URL 查询参数
import ListSearch from '../../components/ListSearch';

// 自定义 Hook：根据筛选条件请求问卷列表
// 这里传入 isDeleted: true，只加载回收站问卷
import useLoadQuestionListData from '../../hooks/useLoadQuestionListData';

// 分页器组件：从 total 计算总页数，页码和每页条数保存在 URL 上
import ListPage from '../../components/ListPage';

// 问卷相关服务：
// deleteQuestionService  彻底删除问卷（物理删除）
// updateQuestionService  更新问卷，这里用于把 isDeleted 改回 false
import { deleteQuestionService, updateQuestionService } from '../../services/question';

// 引入 ahooks：
// useRequest  管理请求状态（loading / 手动触发 / 成功回调）
// useTitle    设置浏览器标签页标题
import { useRequest, useTitle } from 'ahooks';

/**
 * 问卷数据类型定义
 * 用于表格 dataSource 和行选择配置
 */
interface DataType {
    _id: React.Key; // 问卷唯一标识，同时作为 Table 的 rowKey
    title: string; // 问卷标题
    isPublished: boolean; // 是否已发布
    isStar: boolean; // 是否已标星
    answerCount: number; // 答卷数量
    createdAt: string; // 创建时间
}

/* 模拟的回收站问卷数据（例）
const rawQuestionList: DataType[] = [
    {
        _id: 'q1',
        title: '问题1',
        isPublished: true,
        isStar: false,
        answerCount: 5,
        createdAt: '2026/1/1 13:30:30',
    },
]; */

// 表格列配置：定义每一列的表头和对应的数据字段
const tableColumns: TableColumnsType<DataType> = [
    {
        title: '标题',
        dataIndex: 'title', // 对应 DataType.title
        key: 'title',
    },
    {
        title: '是否发布',
        dataIndex: 'isPublished',
        key: 'isPublished',
        // 自定义渲染：根据布尔值显示不同颜色的标签
        render: (isPublished: boolean) => {
            return isPublished ? <Tag color="processing">已发布</Tag> : <Tag>未发布</Tag>;
        },
    },
    {
        title: '答卷',
        dataIndex: 'answerCount',
        key: 'answerCount',
    },
    {
        title: '创建时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
    },
];

// 解构出 Typography 的 Title 组件，用于渲染页面标题
const { Title } = Typography;

const Trash: FC = () => {
    // 设置浏览器标签页标题
    useTitle('小慕问卷 - 回收站');

    // 调用自定义 Hook，获取已删除的问卷列表及加载状态：
    // - isDeleted: true  只查回收站问卷
    // - loading          是否正在请求
    // - data             包含 list（本页列表）和 total（符合条件的总数）
    // - refresh          操作成功后调用，重新拉取最新列表
    const { loading, data = {}, refresh } = useLoadQuestionListData({ isDeleted: true });

    // 从返回数据中解构出列表数组和总数，并提供默认值：
    // - questionList  本页的回收站问卷
    // - total         回收站问卷总数，传给分页器计算总页数
    const { list: questionList = [], total = 0 } = data;

    // const [questionList, setQuestionList] = useState(list);

    // 选择类型：checkbox 多选或 radio 单选
    // 当前固定为 checkbox，支持批量操作
    const [selectionType] = useState<'checkbox' | 'radio'>('checkbox');

    // 当前选中的问卷 ID 列表，来自 Table 的 rowSelection.onChange
    // 用于批量恢复和批量彻底删除
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    /**
     * Modal 实例
     * - modal：用于命令式调用 modal.confirm 弹出确认框
     * - contextHolder：必须渲染到组件树中，保证弹窗上下文正确
     */
    const [modal, contextHolder] = Modal.useModal();

    /**
     * 批量彻底删除请求
     *
     * 功能说明：
     * - 手动触发，点击"删除"按钮并确认后执行
     * - 一次删除 selectedIds 中所有问卷（物理删除，不可恢复）
     *
     * 状态说明：
     * - run: deleteQuestions  手动触发删除
     * - manual: true          不自动执行
     * - onSuccess             成功后提示、刷新列表、清空选中
     */
    const { run: deleteQuestions } = useRequest(
        async () => await deleteQuestionService(selectedIds),
        {
            manual: true, // 不自动执行，需手动调用
            // debounceWait: 500,
            onSuccess() {
                // 显示成功提示
                message.success('删除成功');
                // 重新拉取最新列表，回收站中不再显示已删除的问卷
                refresh();
                // 清空选中项，避免残留 ID
                setSelectedIds([]);
            },
        }
    );

    /**
     * 批量恢复请求 - 1
     *
     * 功能说明：
     * - 手动触发，点击"恢复"按钮后执行
     * - 按顺序把 selectedIds 中每个问卷的 isDeleted 改为 false
     * - 恢复后的问卷会重新出现在"我的问卷"或"星标问卷"列表中
     *
     * 实现说明：
     * - 使用 for await...of 串行调用，避免并发写操作冲突
     * - 全部成功后统一刷新列表
     *
     * 状态说明：
     * - recoverLoading  请求期间为 true，用于禁用恢复按钮
     * - recoverQuestion 手动触发恢复
     */
    // const { loading: recoverLoading, run: recoverQuestion } = useRequest(
    //     async () => {
    //         // 串行恢复：逐个把问卷的 isDeleted 置为 false
    //         for await (const id of selectedIds) {
    //             await updateQuestionService(id, { isDeleted: false });
    //         }
    //     },
    //     {
    //         manual: true, // 不自动执行，需手动调用
    //         // debounceWait: 500,
    //         onSuccess() {
    //             // 显示成功提示
    //             message.success('恢复成功');
    //             // 重新拉取最新列表，恢复的问卷不再显示在回收站
    //             refresh();
    //             // 清空选中项
    //             setSelectedIds([]);
    //         },
    //     }
    // );

    /**
     * 批量恢复请求 - 2
     *
     * 功能说明：
     * - 手动触发，点击"恢复"按钮后执行
     * - 把 selectedIds 中每个问卷的 isDeleted 改回 false
     * - 恢复后的问卷会重新出现在"我的问卷"或"星标问卷"列表中
     *
     * 实现说明：
     * - 用 Promise.all 并发发送全部恢复请求，相比串行 for await...of 显著提升性能
     * - 全部成功后统一刷新列表；任意一条失败时整个操作视为失败，
     *   不会刷新列表，避免部分恢复造成数据不一致
     *
     * 状态说明：
     * - recoverLoading  请求期间为 true，用于禁用恢复按钮
     * - recoverQuestion 手动触发恢复
     */
    const { loading: recoverLoading, run: recoverQuestion } = useRequest(
        async () => {
            // 并发恢复：一次性发出全部请求，等待全部完成
            await Promise.all(
                selectedIds.map(id => updateQuestionService(id, { isDeleted: false }))
            );
        },
        {
            manual: true, // 不自动执行，需手动调用
            // debounceWait: 500,
            onSuccess() {
                // 显示成功提示
                message.success('恢复成功');
                // 全部恢复成功后再刷新列表，回收站中不再显示这些问卷
                refresh();
                // 清空选中项
                setSelectedIds([]);
            },
        }
    );

    /**
     * 删除问卷的 Modal 弹窗配置
     * 用于 modal.confirm 命令式调用
     */
    const deleteModalConfig = {
        title: '删除问卷', // 弹窗标题
        content: '确定要彻底删除以下问卷？', // 弹窗提示内容
        icon: <ExclamationCircleOutlined />, // 警告图标

        /**
         * 点击"确定"时：
         * - 触发批量彻底删除请求
         * - 成功后的逻辑由 deleteQuestions 的 onSuccess 处理
         */
        onOk: deleteQuestions,

        okText: '确定', // 确定按钮文案
        cancelText: '取消', // 取消按钮文案
    };

    /**
     * 表格行选择配置
     * 用于 Table 的 rowSelection，实现多选功能
     */
    const rowSelection: TableProps<DataType>['rowSelection'] = {
        // 选中项变化时，把选中的行 key 保存为字符串数组
        onChange: (selectedRowKeys: React.Key[], selectedRows: DataType[]) => {
            console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
            // 转为字符串数组保存，和服务的入参类型一致
            setSelectedIds(selectedRowKeys as string[]);
        },

        // 设置某些行不可选，这里示例为标题等于 'Disabled User' 的行
        getCheckboxProps: (record: DataType) => ({
            disabled: record.title === 'Disabled User', // Column configuration not to be checked
            name: record.title,
        }),
    };

    // 表格元素（包含操作按钮和表格）
    const TableElem = (
        <>
            {/* 批量操作按钮区 */}
            <div style={{ marginBottom: '16px' }}>
                <Space>
                    {/* 恢复按钮，未选中时禁用 */}
                    <Button
                        type="primary"
                        // 未选中或恢复中时禁用，防止重复提交
                        disabled={selectedIds.length === 0 || recoverLoading}
                        onClick={recoverQuestion}
                    >
                        恢复
                    </Button>
                    <>
                        {/* 删除按钮，未选中时禁用 */}
                        <Button
                            danger
                            disabled={selectedIds.length === 0}
                            onClick={() => {
                                // 点击后弹出删除确认弹窗，带遮罩模糊效果
                                modal.confirm({ ...deleteModalConfig, mask: { blur: true } });
                            }}
                        >
                            删除
                        </Button>
                        {/* 
                            Modal 占位节点：
                            必须渲染在组件树中，
                            否则命令式弹窗（modal.confirm）无法正确显示
                        */}
                        {contextHolder}
                    </>
                </Space>
            </div>

            {/* 问卷表格：绑定数据源、列配置、关闭分页、用 _id 作为行 key */}
            <Table<DataType>
                dataSource={questionList} // 本页回收站问卷列表
                columns={tableColumns} // 列配置
                pagination={false} // 关闭 Table 内置分页，改用底部 ListPage
                rowKey={q => q._id} // 用问卷 ID 作为行唯一 key
                rowSelection={{ type: selectionType, ...rowSelection }} // 行选择配置
            />
        </>
    );

    return (
        <>
            {/* 页面头部：标题和搜索框 */}
            <div className={styles.header}>
                <div className={styles.left}>
                    <Title level={3}>星标问卷</Title>
                </div>
                <div className={styles.right}>
                    {/* 搜索框：关键字写入 URL，会触发列表重新请求 */}
                    <ListSearch />
                </div>
            </div>

            {/* 内容区：空状态或表格 */}
            <div className={styles.content}>
                {/* 加载中：居中显示 Spin 加载动画 */}
                {loading && (
                    <div style={{ textAlign: 'center' }}>
                        <Spin />
                    </div>
                )}
                {/* 加载完成但无数据：显示空状态提示 */}
                {!loading && questionList.length === 0 && (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
                )}
                {/* 加载完成且有数据：渲染表格区域 */}
                {!loading && questionList.length > 0 && TableElem}
            </div>

            {/* 分页区域 */}
            <div className={styles.footer}>
                {/* 
                    分页器：
                    - total 决定总页数
                    - 页码和每页条数写在 URL 上，翻页后触发上面的 Hook 重新请求
                */}
                <ListPage total={total} />
            </div>
        </>
    );
};

export default Trash;
