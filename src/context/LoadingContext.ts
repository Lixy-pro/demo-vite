import { createContext } from 'react';

// 暂时不用
export const LoadingContext = createContext({
    isLoading: true,
    toggleLoading: () => {},
});
