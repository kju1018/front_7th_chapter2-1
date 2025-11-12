import { router } from "./router.js";
import { store } from "./store/store.js";
import { HomePage } from "./pages/HomePage.js";
import { DetailPage } from "./pages/DetailPage.js";
import { getProducts, getCategories } from "./api/productApi";

const enableMocking = () =>
  import("./mocks/browser.js").then(({ worker }) =>
    worker.start({
      onUnhandledRequest: "bypass",
      serviceWorker: {
        // 여기
        url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
      },
    }),
  );

document.body.addEventListener("click", (e) => {
  const params = new URLSearchParams(window.location.search);

  if (e.target.closest(".product-card")) {
    const productId = e.target.closest(".product-card").dataset.productId;
    router.push(`/products/${productId}`);
  }

  // category1 버튼 클릭
  if (e.target.closest(".category1-filter-btn")) {
    const category1 = e.target.closest(".category1-filter-btn").dataset.category1;
    store.setState({ category1, category2: "" });
    params.set("category1", category1);
    router.push(`?${params.toString()}`);
  }

  // category2 버튼 클릭
  if (e.target.closest(".category2-filter-btn")) {
    const category1 = e.target.closest(".category2-filter-btn").dataset.category1;
    const category2 = e.target.closest(".category2-filter-btn").dataset.category2;
    store.setState({ category1, category2 });
    params.set("category1", category1);
    params.set("category2", category2);
    router.push(`?${params.toString()}`);
  }

  // 전체 버튼 클릭
  if (e.target.closest('[data-breadcrumb="reset"]')) {
    store.setState({ category1: "", category2: "" });
    router.push(`?`);
  }
});

document.body.addEventListener("keydown", (e) => {
  const input = e.target.closest("#search-input");
  if (!input) return;

  // ✅ Enter 입력 시만 동작
  if (e.key === "Enter") {
    const keyword = input.value.trim();

    if (!keyword && !store.state.search) return;
    if (keyword === store.state.search) return;

    // 상태 업데이트 (필요하면 페이지 리렌더 유도)
    store.setState({ search: keyword, pagination: { page: 1, limit: 20 } });

    // URL 쿼리 반영
    const params = new URLSearchParams(window.location.search);
    if (keyword) {
      params.set("search", keyword);
    } else {
      params.delete("search");
    }
    router.push(`?${params.toString()}`);
  }
});

function syncStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const category1 = params.get("category1") || "";
  const category2 = params.get("category2") || "";

  if (store.state.category1 !== category1 || store.state.category2 !== category2) {
    store.setState({ category1, category2 });
  }
}

const loadProducts = async () => {
  const { category1, category2, search, pagination } = store.state;
  const filters = {
    page: pagination.page,
    limit: pagination.limit,
    ...(category1 && { category1 }),
    ...(category2 && { category2 }),
    ...(search && { search }),
  };

  store.setState({ loading: true });
  const response = await getProducts(filters);
  store.setState({
    products: response.products,
    pagination: response.pagination,
    loading: false,
  });
};

const loadCategories = async () => {
  const response = await getCategories();
  store.setState({ categories: response });
};

// 라우터 초기 세팅
const render = async ({ isQueryOnly = false } = {}) => {
  syncStateFromUrl();
  const path = router.path;
  console.log(path);
  if (path === "/") {
    if (!isQueryOnly) {
      await HomePage(); // 전체 렌더
      await loadCategories();
    }
    await loadProducts(); // 공통
  } else if (path.startsWith("/products")) {
    DetailPage();
  }
};

async function main() {
  router.setup();
  render();
  router.subscribe(render);
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
