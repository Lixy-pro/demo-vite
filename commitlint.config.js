/**
 * commitlint 配置
 * 作用：校验 git commit 消息格式，不合规的提交会被 husky 的 commit-msg 钩子拦截
 * 生效前提：
 *   1. 已安装 @commitlint/cli 和 @commitlint/config-conventional
 *   2. .husky/commit-msg 里有：npx --no-install commitlint --edit "$1"
 */

export default {
    // 继承「约定式提交」官方规则集（Conventional Commits 规范）
    // 要求提交信息形如：  <type>(<scope>): <subject>
    // 例如：
    //   feat(login): 新增手机号登录
    //   fix(api): 修复请求超时未重试
    //   chore: 更新依赖版本
    extends: ['@commitlint/config-conventional'],

    // 该规则集内置的 type 白名单（可按需追加自定义类型）：
    //   feat     新功能
    //   fix      修复缺陷
    //   docs     文档变更
    //   style    代码格式（不影响逻辑，如空格、分号）
    //   refactor 重构（既非新功能也非修复）
    //   perf     性能优化
    //   test     测试相关
    //   build    构建系统或外部依赖变更（webpack、npm 等）
    //   ci       CI 配置与脚本变更
    //   chore    其他杂项（不修改 src 或测试文件）
    //   revert   回滚某次提交

    // ↓ 下面是常见的自定义扩展，按需取消注释即可覆盖默认规则
    /*
    rules: {
        // 追加自定义 type：第二个参数 'always' 表示必须满足该规则
        'type-enum': [
            2,        // 错误级别：2 = 报错并阻断提交（1 = 警告，0 = 关闭）
            'always',
            ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert', 'wip'],
        ],

        // 标题长度限制（subject 部分）
        'subject-max-length': [2, 'always', 72],

        // 标题不能用句号结尾
        'subject-full-stop': [2, 'never', '.'],

        // type 必须小写
        'type-case': [2, 'always', 'lower-case'],

        // scope 可选，不做强制
        'scope-empty': [0],
    },
    */
};
