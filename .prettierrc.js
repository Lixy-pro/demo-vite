// .prettierrc.mjs
export default {
    // 箭头函数只有一个参数时省略括号：(x) => {} 简写为 x => {}
    arrowParens: 'avoid',

    // 对象/数组的大括号内侧加空格：{ foo: 1 }
    bracketSpacing: true,

    // JSX 多行元素闭合括号是否放行尾（false = 另起一行，React 官方风格）
    // 旧版叫 jsxBracketSameLine，新版更名为 bracketSameLine
    bracketSameLine: false,

    // Markdown 保持原作者换行，不强制重排
    proseWrap: 'preserve',

    // 语句末尾加分号
    semi: true,

    // 使用单引号
    singleQuote: true,

    // 缩进 4 个空格
    tabWidth: 4,

    // 用空格缩进，不用 Tab
    useTabs: false,

    // 多行时末尾加逗号（es5：对象/数组加，函数参数不加）
    trailingComma: 'es5',

    // 单行最大宽度 100 字符
    printWidth: 100,

    // 统一 LF 换行符（Linux/macOS 风格）
    endOfLine: 'lf',

    // ⚠️ parser 只对 TS 文件生效，避免影响 CSS/HTML/MD 等文件
    overrides: [
        {
            files: ['*.ts', '*.tsx', '*.mts', '*.cts'],
            options: {
                parser: 'typescript',
            },
        },
    ],
};
