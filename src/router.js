import { HomePage } from "./pages/HomePage";
import { DetailPage } from "./pages/DetailPage";

export function router() {
  const path = location.pathname;

  if (path === "/") {
    HomePage();
  } else if (path.startsWith("/products")) {
    DetailPage();
  }
}

router.push = function (path) {
  history.pushState(null, "", path);
  router();
};

router.replace = function (path) {
  history.replaceState(null, "", path);
  router();
};

router.init = function () {
  window.addEventListener("popstate", router);
};
