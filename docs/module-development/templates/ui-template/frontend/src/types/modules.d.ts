declare namespace React {
  type ReactNode = any;
  interface FC<P = {}> {
    (props: P & { children?: ReactNode }): ReactNode | null;
  }
  interface MutableRefObject<T> {
    current: T;
  }
  type Dispatch<A> = (value: A) => void;
  type SetStateAction<S> = S | ((prevState: S) => S);

  function useEffect(effect: (...args: any[]) => any, deps?: any[]): void;
  function useMemo<T>(factory: () => T, deps: any[]): T;
  function useRef<T>(initialValue: T | null): MutableRefObject<T | null>;
  function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
  function lazy<T>(factory: () => Promise<T>): FC<any>;

  const Suspense: FC<{ fallback?: ReactNode }>;
  const Fragment: any;
}

declare module 'react' {
  export = React;
  export as namespace React;

  export type ReactNode = React.ReactNode;
  export type FC<P = {}> = React.FC<P>;
  export type Dispatch<A> = React.Dispatch<A>;
  export type SetStateAction<S> = React.SetStateAction<S>;
  export type MutableRefObject<T> = React.MutableRefObject<T>;

  export const useEffect: typeof React.useEffect;
  export const useMemo: typeof React.useMemo;
  export const useRef: typeof React.useRef;
  export const useState: typeof React.useState;
  export const useCallback: typeof React.useCallback;
  export const lazy: typeof React.lazy;

  const reactDefault: {
    createElement: (...args: any[]) => any;
  };

  export default reactDefault;
  export const Suspense: typeof React.Suspense;
  export const Fragment: typeof React.Fragment;
}

declare module 'react/jsx-runtime' {
  export const jsx: (...args: any[]) => any;
  export const jsxs: (...args: any[]) => any;
  export const Fragment: any;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elementName: string]: any;
  }
}

declare module 'antd' {
  export type ThemeConfig = any;
  export const theme: {
    defaultAlgorithm: any;
    darkAlgorithm: any;
  };

  export const ConfigProvider: (props: {
    componentSize?: string;
    theme?: ThemeConfig;
    children?: any;
  }) => any;
}

declare module '@hla-compass/design-system' {
  export { ConfigProvider } from 'antd';
}
