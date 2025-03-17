declare namespace React {
  interface FC<P = {}> {
    (props: P): JSX.Element | null;
  }

  type PropsWithChildren<P = unknown> = P & { children?: ReactNode | undefined };
  type ReactNode = ReactElement | string | number | ReactFragment | ReactPortal | boolean | null | undefined;
  type ReactFragment = {} | ReactNodeArray;
  type ReactNodeArray = Array<ReactNode>;
  type ReactPortal = any;
  type ReactElement = any;

  interface HTMLAttributes<T> {
    className?: string;
    style?: any;
    [key: string]: any;
  }

  interface DetailedHTMLProps<P extends HTMLAttributes<T>, T> {
    [key: string]: any;
  }

  function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
  function useEffect(effect: () => (void | (() => void)), deps?: ReadonlyArray<any>): void;
}

declare module 'react' {
  export = React;
  export as namespace React;
} 