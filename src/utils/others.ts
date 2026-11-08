/** 用默认值补齐 props，保证返回完整配置 */
export function withDefaultProps<T extends object>(
    defaultProps: Partial<T>,
    props?: Partial<T>
): T {
    return { ...defaultProps, ...props } as T;
}

// 使用
// const final = withDefaultProps(QuestionInputDefaultProps, props);
// final.title / final.placeholder 都是 string，不再是 string | undefined
