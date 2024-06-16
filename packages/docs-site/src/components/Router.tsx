import { createContext, useContext, useEffect, useState } from "react";

const CounterContext = createContext<number>(0);
const SetCounterContext = createContext<
  React.Dispatch<React.SetStateAction<number>>
>(() => {});

export function Router({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const listener = () => {
      setCount((c) => c + 1);
    };

    window.addEventListener("popstate", listener);
  }, []);

  return (
    <CounterContext.Provider value={count}>
      <SetCounterContext.Provider value={setCount}>
        {children}
      </SetCounterContext.Provider>
    </CounterContext.Provider>
  );
}

export function Route({
  path,
  children,
}: {
  path: string;
  children: React.ReactNode;
}) {
  useContext(CounterContext);
  if (path !== window.location.pathname) {
    return null;
  }

  return <>{children}</>;
}

export function Link({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const setCount = useContext(SetCounterContext);
  return (
    <a
      href={href}
      onClick={(event) => {
        if (event.ctrlKey || event.metaKey) {
          return;
        }

        if (
          href.indexOf("http") === 0 &&
          window.location.host !== new URL(href).host
        ) {
          return;
        }

        event.preventDefault();
        window.history.pushState({}, "", href);
        setCount((c) => c + 1);
      }}
    >
      {children}
    </a>
  );
}
