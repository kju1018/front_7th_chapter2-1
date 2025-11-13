import { createObserver } from "./createObserver";
export const createRouter = () => {
  const { notify, subscribe } = createObserver();

  let lastPath = window.location.pathname; // ✔ 초기값
  const basePath = import.meta.env.BASE_URL;

  const normalize = (path) => path.replace(basePath, "/").replace(/\/$/, "") || "/";

  const push = (path) => {
    const prevPath = normalize(window.location.pathname);

    const fullPath = path.startsWith("/") ? basePath.replace(/\/$/, "") + path : basePath + path;

    history.pushState(null, "", fullPath);

    const newPath = normalize(window.location.pathname);
    const isQueryOnly = prevPath === newPath;

    lastPath = newPath; // ✔ push에서도 갱신

    notify({ isQueryOnly });
  };

  const setup = () => {
    window.addEventListener("popstate", () => {
      const newPath = normalize(window.location.pathname);
      const isQueryOnly = lastPath === newPath;

      lastPath = newPath; // ✔ popstate에서도 갱신

      notify({ isQueryOnly });
    });
  };

  return {
    get path() {
      return normalize(window.location.pathname);
    },
    push,
    setup,
    subscribe,
  };
};
