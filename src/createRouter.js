import { createObserver } from "./createObserver";

export const createRouter = () => {
  const { notify, subscribe } = createObserver();

  const push = (path) => {
    const basePath = import.meta.env.BASE_URL; // ex: '/front_7th_chapter2-1/'
    const prevPath = window.location.pathname;

    const relativePrevPath = prevPath.replace(basePath, "/").replace(/\/$/, "") || "/";

    const fullPath = path.startsWith("/") ? basePath.replace(/\/$/, "") + path : basePath + path;

    const nextUrl = new URL(fullPath, window.location.origin);
    const relativeNextPath = nextUrl.pathname.replace(basePath, "/").replace(/\/$/, "") || "/";

    history.pushState(null, "", fullPath);

    const isQueryOnly = relativePrevPath === relativeNextPath;

    notify({ isQueryOnly });
  };

  const setup = () => {
    window.addEventListener("popstate", () => {
      const prevPath = window.location.pathname;
      const currentUrl = new URL(window.location.href);
      const isQueryOnly = prevPath === currentUrl.pathname;

      notify({ isQueryOnly }); // ✅ popstate도 동일하게 처리
    });
  };
  return {
    get path() {
      const basePath = import.meta.env.BASE_URL; // vite 제공
      return window.location.pathname.replace(basePath, "/").replace(/\/$/, "") || "/";
    },
    push,
    setup,
    subscribe,
  };
};
