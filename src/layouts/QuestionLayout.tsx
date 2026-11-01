/**
 * 问卷详情布局组件
 * 作为问卷编辑页和统计页的公共布局容器
 */
import type { FC } from 'react';
import { Outlet } from 'react-router-dom';

const QuestionLayout: FC = () => {
    return (
        <>
            <p>Question layout</p>
            <div>
                {/* 子路由出口，渲染 Edit 或 Stat 页面 */}
                <Outlet />
            </div>
        </>
    );
};

export default QuestionLayout;
