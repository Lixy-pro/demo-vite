/**
 * 应用根组件
 * 提供路由上下文，渲染整个应用
 */
// import QList from './QList';
// import Others from './Others';
// import Others from './Others_cp';
// import List from './pages/manage/List';
import { RouterProvider } from 'react-router-dom';
import routerConfig from './router';
// import Count from './study-myself/redux/Count';
// import TodoList from './study-myself/redux/TodoList';

function App() {
    return (
        <div className="App">
            {/* <QList />
            <hr />
            <Others /> */}
            {/* <h1 style={{ background: 'yellow' }}>问卷 FE</h1>
            <List /> */}
            {/* 路由提供者，注入路由配置 */}
            <RouterProvider router={routerConfig}></RouterProvider>
            {/* <h1>Redux demo</h1>
            <Count />
            <hr />
            <TodoList /> */}
        </div>
    );
}

export default App;
