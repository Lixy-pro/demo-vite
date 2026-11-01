/**
 * 问卷卡片组件（主版本）
 *
 * 功能说明：
 * - 展示单个问卷的核心信息：标题、发布状态、星标状态、答卷数量、创建时间
 * - 提供以下操作入口：
 *    1. 编辑问卷
 *    2. 查看问卷统计（仅发布后可用）
 *    3. 标星 / 取消标星
 *    4. 复制问卷
 *    5. 删除问卷（弹窗确认）
 *
 * 设计说明：
 * - 组件本身不负责请求完整列表，只更新当前这一条问卷数据
 * - 通过 `updateQuestion` 回调把最新数据回传给父组件，由父组件统一维护列表
 * - 使用 `message.useMessage` 和 `Modal.useModal` 确保提示和弹窗上下文正确
 */

// React 函数组件类型
import type { FC } from 'react';

// 组件样式模块
import styles from './QCard.module.scss';

// Ant Design 的 Popconfirm 回调类型
import type { PopconfirmProps } from 'antd';

// 引入 Ant Design 组件：
// Button       操作按钮
// Space        水平排列子元素
// Divider      分割线
// Tag          状态标签
// Popconfirm   弹出确认框
// message      全局提示
// Modal        命令式弹窗
import { Button, Space, Divider, Tag, Popconfirm, message, Modal } from 'antd';

// 引入 Ant Design 图标
import {
    EditOutlined, // 编辑
    LineChartOutlined, // 统计
    StarOutlined, // 标星
    CopyOutlined, // 复制
    DeleteOutlined, // 删除
    ExclamationCircleOutlined, // 警告
} from '@ant-design/icons';

// 路由跳转和链接组件
import { useNavigate, Link } from 'react-router-dom';

// ahooks 请求管理工具
import { useRequest } from 'ahooks';

// 问卷相关服务接口：
// updateQuestionService    更新问卷
// duplicateQuestionService 复制问卷
import { updateQuestionService, duplicateQuestionService } from '../services/question';

/**
 * 单个问卷的数据结构
 * 用于父组件列表和回写更新后的问卷数据
 */
type Question = {
    _id: string; // 问卷唯一标识
    title: string; // 问卷标题
    isPublished: boolean; // 是否已发布
    isStar: boolean; // 是否已标星
    answerCount: number; // 答卷数量
    createdAt: string; // 创建时间
    isDeleted: boolean; // 是否已删除
};

/**
 * 问卷卡片组件的 Props 类型定义
 */
type PropsType = {
    _id: string; // 问卷 ID
    title: string; // 问卷标题
    isPublished: boolean; // 发布状态
    isStar: boolean; // 星标状态
    answerCount: number; // 答卷数量
    createdAt: string; // 创建时间
    isDeleted: boolean; // 删除状态

    /**
     * 更新当前问卷的回调
     * @param question - 更新后的问卷数据
     */
    updateQuestion: (question: Question) => void;

    /**
     * 删除问卷的回调（可选）
     * @param id - 被删除的问卷 ID
     */
    deleteQuestion?: (id: string) => void;

    /**
     * 发布问卷的回调（可选）
     * @param id - 被发布的问卷 ID
     */
    publishQuestion?: (id: string) => void;
};

/**
 * QCard 问卷卡片组件
 *
 * FC - Functional Component（函数组件）
 * 接收问卷数据和更新回调，渲染问卷信息及操作按钮
 */
const QCard: FC<PropsType> = props => {
    // 解构当前问卷需要展示和操作的字段
    const { _id, title, isPublished, isStar, answerCount, createdAt, updateQuestion } = props;

    // 路由跳转方法
    const nav = useNavigate();

    /**
     * message 实例
     * - messageApi：用于手动触发提示
     * - holder：必须渲染到组件树中，否则提示可能不显示或上下文错误
     */
    const [messageApi, holder] = message.useMessage();

    /**
     * Modal 实例
     * - modal：用于命令式调用 confirm / info 等弹窗
     * - contextHolder：必须渲染到组件树中，保证弹窗上下文正确
     */
    const [modal, contextHolder] = Modal.useModal();

    /**
     * 标星 / 取消标星请求
     *
     * - manual: true 表示不自动发送请求，需手动调用 run（changeStar）
     * - loading 可用于按钮禁用，防止重复点击
     * - 请求成功后，将取反后的最新状态回传给父组件
     */
    const { loading: changeStarLoading, run: changeStar } = useRequest(
        async () => {
            // 调用更新接口，把当前问卷的 isStar 取反
            const data = await updateQuestionService(_id, {
                isStar: !isStar,
            });
            return data;
        },
        {
            manual: true, // 手动触发
            onSuccess() {
                /**
                 * 请求成功后：
                 * 1. 构造最新的问卷数据（isStar 取反）
                 * 2. 通过父组件传入的 updateQuestion 回写最新数据
                 * 3. 显示成功提示
                 */
                updateQuestion({
                    _id,
                    title,
                    isPublished,
                    isStar: !isStar,
                    answerCount,
                    createdAt,
                    isDeleted: props.isDeleted,
                });

                message.success('星标已更新');
            },
        }
    );

    /**
     * 【新增机能】复制问卷请求
     *
     * 功能说明：
     * - 点击“复制”并确认后触发
     * - 调用 duplicateQuestionService 复制当前问卷
     * - 复制成功后跳转到新问卷的编辑页面
     *
     * 参数说明：
     * @param e - Popconfirm 的确认事件参数，用于调试或扩展处理
     *
     * 状态说明：
     * - duplicateLoading 用于禁用复制按钮，防止重复提交
     * - duplicate 用于手动触发复制请求
     */
    const { loading: duplicateLoading, run: duplicate } = useRequest(
        async e => {
            // 调试：输出触发复制操作的目标元素
            console.log(e?.target);

            /**
             * 调用复制问卷接口
             * 通常服务端会创建一份新的问卷并返回新问卷 ID
             */
            const data = await duplicateQuestionService(_id);
            return data;
        },
        {
            manual: true, // 不自动请求，需要手动调用 duplicate()

            onSuccess(result) {
                /**
                 * 复制成功后的处理：
                 * 1. 显示成功提示
                 * 2. 跳转到新复制问卷的编辑页面，便于用户立即修改
                 *
                 * 注意：
                 * - result.id 应由服务端返回
                 * - 如果返回字段不同，需要按实际接口结构调整
                 */
                message.success('复制成功');
                nav(`/question/edit/${result.id}`);
            },
        }
    );

    /**
     * 【新增机能】删除问卷请求（软删除）
     *
     * 功能说明：
     * - 点击“删除”并确认后触发
     * - 通过把 isDeleted 设为 true 实现软删除
     * - 删除成功后通知父组件更新当前问卷状态
     *
     * 状态说明：
     * - deleteLoading 用于禁用删除按钮，防止重复提交
     * - deleteQuestion 用于手动触发删除请求
     */
    const { loading: deleteLoading, run: deleteQuestion } = useRequest(
        async () => {
            /**
             * 调用更新接口，将当前问卷标记为已删除
             * 属于“软删除”，不真正从数据库中移除数据
             */
            const data = await updateQuestionService(_id, {
                isDeleted: true,
            });
            return data;
        },
        {
            manual: true, // 不自动请求，需要手动调用 deleteQuestion()

            onSuccess() {
                /**
                 * 请求成功后：
                 * 1. 构造最新的问卷数据，把 isDeleted 设为 true
                 * 2. 通过父组件传入的 updateQuestion 回写最新数据
                 * 3. 显示删除成功提示
                 *
                 * 父组件通常会：
                 * - 从“我的问卷”列表中移除该问卷
                 * - 或在回收站列表中显示该问卷
                 */
                updateQuestion({
                    _id,
                    title,
                    isPublished,
                    isStar,
                    answerCount,
                    createdAt,
                    isDeleted: true,
                });

                message.success('删除成功');
            },
        }
    );

    /**
     * 【新增机能】复制问卷取消回调
     *
     * 功能说明：
     * - 在复制确认弹窗中点击“取消”时触发
     * - 仅输出调试信息并显示取消提示，不执行复制操作
     *
     * @param e - Popconfirm 的取消事件参数
     */
    const copyCancel: PopconfirmProps['onCancel'] = e => {
        // 调试：输出触发取消操作的目标元素
        console.log(e?.target);
        // 显示取消复制提示
        messageApi.error('取消复制');
    };

    /**
     * 【新增机能】删除问卷的 Modal 弹窗配置
     *
     * 功能说明：
     * - 用于命令式调用 modal.confirm
     * - 点击“确定”执行删除请求
     * - 点击“取消”显示取消提示
     */
    const deleteModalConfig = {
        title: '删除问卷', // 弹窗标题

        content: '确定删除该问卷？', // 弹窗提示内容

        icon: <ExclamationCircleOutlined />, // 警告图标

        /**
         * 点击“确定”时：
         * - 触发删除问卷请求
         * - 实际删除逻辑由 deleteQuestion 的 onSuccess 处理
         */
        onOk: () => {
            deleteQuestion();
        },

        /**
         * 点击“取消”时：
         * - 显示取消删除提示
         * - 不执行删除操作
         */
        onCancel: () => {
            message.error('取消删除');
        },

        okText: '确定', // 确定按钮文案
        cancelText: '取消', // 取消按钮文案
    };

    return (
        <div key={_id} className={styles.container}>
            {/* ================= 标题区域 ================= */}
            {/* 左侧：标题链接；右侧：发布状态、答卷数、创建时间 */}
            <div className={styles.title}>
                {/* 左侧标题 */}
                <div className={styles.left}>
                    {/* 
                        根据发布状态决定跳转页面：
                        - 已发布：跳转到统计页面
                        - 未发布：跳转到编辑页面
                    */}
                    <Link to={isPublished ? `/question/stat/${_id}` : `/question/edit/${_id}`}>
                        <Space>
                            {/* 已标星时显示红色星标图标 */}
                            {isStar && <StarOutlined style={{ color: 'red' }} />}
                            {/* 问卷标题 */}
                            {title}
                        </Space>
                    </Link>
                </div>

                {/* 右侧状态信息 */}
                <div className={styles.right}>
                    <Space>
                        {/* 发布状态标签 */}
                        {isPublished ? <Tag color="processing">已发布</Tag> : <Tag>未发布</Tag>}
                        {/* 答卷数量 */}
                        <span>答卷: {answerCount}</span>
                        {/* 创建时间 */}
                        <span>{createdAt}</span>
                    </Space>
                </div>
            </div>

            {/* 标题区与操作区之间的分割线 */}
            <Divider size="small" />

            {/* ================= 操作按钮区域 ================= */}
            {/* 左侧：编辑 / 统计；右侧：标星 / 复制 / 删除 */}
            <div className={styles['button-container']}>
                {/* 左侧操作按钮 */}
                <div className={styles.left}>
                    <Space>
                        {/* 编辑问卷按钮 */}
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => {
                                // 跳转到问卷编辑页
                                nav(`/question/edit/${_id}`);
                            }}
                        >
                            编辑问卷
                        </Button>

                        {/* 问卷统计按钮 */}
                        <Button
                            type="text"
                            size="small"
                            icon={<LineChartOutlined />}
                            onClick={() => {
                                // 跳转到问卷统计页
                                nav(`/question/stat/${_id}`);
                            }}
                            // 未发布时禁用统计按钮
                            disabled={!isPublished}
                        >
                            问卷统计
                        </Button>
                    </Space>
                </div>

                {/* 右侧操作按钮 */}
                <div className={styles.right}>
                    <Space>
                        {/* 标星 / 取消标星按钮 */}
                        <Button
                            type="text"
                            icon={<StarOutlined />}
                            size="small"
                            onClick={changeStar}
                            // 请求过程中禁用按钮，防止重复提交
                            disabled={changeStarLoading}
                        >
                            {isStar ? '取消标星' : '标星'}
                        </Button>

                        <>
                            {/* 
                                message 占位节点：
                                必须渲染在组件树中，
                                否则 messageApi 弹出的提示无法正确显示
                            */}
                            {holder}

                            {/* 复制问卷确认弹窗 */}
                            <Popconfirm
                                title="复制问卷"
                                description="确定复制该问卷？"
                                onConfirm={duplicate}
                                onCancel={copyCancel}
                                okText="确定"
                                cancelText="取消"
                            >
                                <Button
                                    type="text"
                                    icon={<CopyOutlined />}
                                    size="small"
                                    // 复制请求过程中禁用按钮，防止重复提交
                                    disabled={duplicateLoading}
                                >
                                    复制
                                </Button>
                            </Popconfirm>
                        </>

                        <>
                            {/* 删除问卷按钮 */}
                            <Button
                                type="text"
                                icon={<DeleteOutlined />}
                                size="small"
                                onClick={() => {
                                    /**
                                     * 点击删除按钮：
                                     * 弹出删除确认弹窗，并启用遮罩模糊效果
                                     */
                                    modal.confirm({
                                        ...deleteModalConfig,
                                        mask: { blur: true },
                                    });
                                }}
                                // 删除请求过程中禁用按钮，防止重复提交
                                disabled={deleteLoading}
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
            </div>
        </div>
    );
};

export default QCard;
