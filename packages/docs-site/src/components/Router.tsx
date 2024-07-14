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

export function usePathname() {
  useContext(CounterContext);
  const pathname = window.location.pathname;
  if (pathname.endsWith("/")) {
    return pathname.substring(0, pathname.length - 1);
  }

  return pathname;
}

export function Route({
  path,
  children,
}: {
  path: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (path !== pathname) {
    return null;
  }

  return <>{children}</>;
}

export function Link({
  href,
  children,
  "aria-current": ariaCurrent,
}: {
  href: string;
  children: React.ReactNode;
  "aria-current"?: "page";
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
      aria-current={ariaCurrent}
    >
      {children}
    </a>
  );
}
