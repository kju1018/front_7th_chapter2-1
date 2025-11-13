import { router } from "./router.js";
import { store } from "./store/store.js";
import { HomePage } from "./pages/HomePage.js";
import { DetailPage } from "./pages/DetailPage.js";
import { getProducts, getCategories, getProduct } from "./api/productApi";

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

function pushWithParams(params) {
  params.set("current", 1); // ✅ 항상 current=1 설정
  router.push(`?${params.toString()}`);
}

document.body.addEventListener("click", (e) => {
  const params = new URLSearchParams(window.location.search);

  if (e.target.closest(".product-card")) {
    const productId = e.target.closest(".product-card").dataset.productId;
    router.push(`/product/${productId}`);
    return;
  }

  // category1 버튼 클릭
  if (e.target.closest(".category1-filter-btn")) {
    const category1 = e.target.closest(".category1-filter-btn").dataset.category1;
    params.set("category1", category1);
    pushWithParams(params); // ✅ 공통 처리
  }

  // category2 버튼 클릭
  if (e.target.closest(".category2-filter-btn")) {
    const category1 = e.target.closest(".category2-filter-btn").dataset.category1;
    const category2 = e.target.closest(".category2-filter-btn").dataset.category2;
    params.set("category1", category1);
    params.set("category2", category2);
    pushWithParams(params);
  }

  // breadcrumb category1 버튼 클릭
  if (e.target.closest('[data-breadcrumb="category1"]')) {
    const category1 = e.target.closest('[data-breadcrumb="category1"]').dataset.category1;
    params.set("category1", category1);
    params.delete("category2");
    pushWithParams(params);
  }

  // 전체 버튼 클릭
  if (e.target.closest('[data-breadcrumb="reset"]')) {
    params.delete("category1");
    params.delete("category2");
    pushWithParams(params);
  }

  // 상세페이지 breadcrumb-link 클릭 (category1 또는 category2)
  if (e.target.closest(".breadcrumb-link")) {
    const category1 = store.state.product.category1;
    const category2 = store.state.product.category2;

    params.set("current", 1); // 페이지 초기화
    if (category1) {
      params.set("category1", category1);
      if (!category2) {
        params.delete("category2"); // category1만 있으면 category2 제거
      } else {
        params.set("category2", category2);
      }
    }
    router.push(`?${params.toString()}`);
  }

  // "상품 목록으로 돌아가기" 버튼 클릭
  if (e.target.closest(".go-to-product-list")) {
    const { product } = store.state;
    const params = new URLSearchParams();

    if (product.category1) {
      params.set("category1", product.category1);
    }
    if (product.category2) {
      params.set("category2", product.category2);
    }

    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : "/");
  }
});

document.body.addEventListener("change", (e) => {
  // limit 선택 이벤트
  if (e.target.id === "limit-select") {
    const limit = parseInt(e.target.value);
    // URL에 limit 추가
    const params = new URLSearchParams(window.location.search);
    params.set("limit", limit);
    pushWithParams(params);
  }

  // sort 선택 이벤트
  if (e.target.id === "sort-select") {
    const sort = e.target.value;

    // URL에 sort 추가
    const params = new URLSearchParams(window.location.search);
    params.set("sort", sort);
    pushWithParams(params);
  }
});

document.body.addEventListener("keydown", (e) => {
  const input = e.target.closest("#search-input");
  if (!input) return;

  // ✅ Enter 입력 시만 동작
  if (e.key === "Enter") {
    const keyword = input.value.trim();

    if (!keyword && !store.state.search) return;
    // URL 쿼리 반영
    const params = new URLSearchParams(window.location.search);
    if (keyword) {
      params.set("search", keyword);
    } else {
      params.delete("search");
    }
    pushWithParams(params);
  }
});

function syncStateFromUrl() {
  const params = new URLSearchParams(window.location.search);

  const urlState = {
    category1: params.get("category1") || "",
    category2: params.get("category2") || "",
    search: params.get("search") || "",
    sort: params.get("sort") || "price_asc",
    pagination: {
      page: parseInt(params.get("current")) || 1,
      limit: parseInt(params.get("limit")) || 20,
    },
  };

  const updates = {};
  const prev = store.state;

  // 1) 필터 변경 → page 초기화가 필요한 경우 체크
  const filterChanged =
    prev.category1 !== urlState.category1 || prev.category2 !== urlState.category2 || prev.search !== urlState.search;

  if (prev.category1 !== urlState.category1) updates.category1 = urlState.category1;
  if (prev.category2 !== urlState.category2) updates.category2 = urlState.category2;

  if (prev.search !== urlState.search) updates.search = urlState.search;
  if (prev.sort !== urlState.sort) updates.sort = urlState.sort;

  // 2) pagination 처리
  const paginationChanged =
    prev.pagination.page !== urlState.pagination.page || prev.pagination.limit !== urlState.pagination.limit;

  if (filterChanged) {
    // 필터 바뀌면 page = 1 유지
    updates.pagination = {
      ...prev.pagination,
      page: 1,
      limit: urlState.pagination.limit,
    };
  } else if (paginationChanged) {
    updates.pagination = urlState.pagination;
  }

  // 3) 업데이트 필요한 경우만 setState
  if (Object.keys(updates).length > 0) {
    store.setState(updates);
  }
}

const loadProducts = async () => {
  const { category1, category2, search, pagination, sort } = store.state;
  const filters = {
    page: pagination.page,
    limit: pagination.limit,
    sort,
    ...(category1 && { category1 }),
    ...(category2 && { category2 }),
    ...(search && { search }),
  };

  store.setState({ loading: true });
  const response = await getProducts(filters);

  // page가 1이면 상품을 새로 로드, 아니면 기존 상품에 추가
  const products = pagination.page === 1 ? response.products : [...store.state.products, ...response.products];

  store.setState({
    products,
    pagination: {
      ...pagination,
      page: pagination.page,
      total: response.pagination.total,
    },
    loading: false,
  });
};

const loadCategories = async () => {
  const response = await getCategories();
  store.setState({ categories: response });
};

// 상품 상세 정보 로드
const loadProductDetail = async (productId) => {
  store.setState({ loading: true, product: null, relatedProducts: [] });
  try {
    const product = await getProduct(productId);

    // category2가 같은 관련 상품 로드 (현재 상품 제외, 최대 4개)
    const relatedResponse = await getProducts({
      category1: product.category1,
      category2: product.category2,
      limit: 20,
    });

    const relatedProducts = relatedResponse.products
      .filter((p) => p.productId !== productId) // 현재 상품 제외
      .slice(0, 20); // 최대 4개만

    store.setState({
      product,
      relatedProducts,
      loading: false,
    });
  } catch (error) {
    console.error("상품 로드 실패:", error);
    store.setState({ loading: false });
  }
};

// 무한스크롤 관련 변수
let isLoadingMore = false;
let infiniteScrollObserver = null;

// 무한스크롤 감지 설정
const setupInfiniteScroll = () => {
  if (infiniteScrollObserver) {
    infiniteScrollObserver.disconnect();
  }

  infiniteScrollObserver = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) return;

      const { products, pagination } = store.state;
      const { total } = pagination;
      const loadedCount = products.length;
      const hasMore = loadedCount < total;

      if (isLoadingMore || !hasMore || store.state.loading) return;

      isLoadingMore = true;
      loadMoreProducts();
    },
    { threshold: 0.1 },
  );

  const triggerElement = document.querySelector("#scroll-trigger");
  if (triggerElement) {
    infiniteScrollObserver.observe(triggerElement);
  }
};

// 다음 페이지 상품 로드
const loadMoreProducts = async () => {
  const { category1, category2, search, pagination, sort } = store.state;
  const nextPage = pagination.page + 1;

  const filters = {
    page: nextPage,
    limit: pagination.limit,
    sort,
    ...(category1 && { category1 }),
    ...(category2 && { category2 }),
    ...(search && { search }),
  };

  store.setState({ loading: true });

  // URL 업데이트 (pushState로 히스토리 남김)
  const params = new URLSearchParams(window.location.search);
  params.set("current", nextPage);
  window.history.pushState(null, "", `?${params.toString()}`);

  const response = await getProducts(filters);

  store.setState({
    products: [...store.state.products, ...response.products],
    pagination: {
      ...pagination,
      page: nextPage,
      total: response.pagination.total,
    },
    loading: false,
  });

  isLoadingMore = false;

  // 무한스크롤 재설정
  setTimeout(() => {
    setupInfiniteScroll();
  }, 0);
};

// 라우터 초기 세팅
const render = async ({ isQueryOnly = false } = {}) => {
  const params = new URLSearchParams(window.location.search);
  const category1 = params.get("category1") || "";
  const category2 = params.get("category2") || "";
  const limit = parseInt(params.get("limit")) || 20;
  const search = params.get("search") || "";
  const sort = params.get("sort") || "price_asc";

  // 필터 관련 파라미터가 변경되었는지 확인
  const filterChanged =
    store.state.category1 !== category1 ||
    store.state.category2 !== category2 ||
    store.state.pagination.limit !== limit ||
    store.state.search !== search ||
    store.state.sort !== sort;

  syncStateFromUrl();
  const path = router.path;

  if (path === "/") {
    if (!isQueryOnly) {
      // 모든 이전 구독 해제
      store.clearObservers();
      await HomePage(); // 전체 렌더
      await loadCategories();
      await loadProducts(); // page=1로 초기 로드
    } else if (filterChanged) {
      // 필터 변경시 (카테고리, 검색 등) loadProducts 호출
      await loadProducts();
    }
    // filterChanged=false && isQueryOnly=true (뒤로가기로 current만 변경)
    // → loadProducts 호출 안 함

    // 무한스크롤 설정
    setTimeout(() => {
      setupInfiniteScroll();
    }, 0);
  } else if (path.startsWith("/product/")) {
    const productId = path.split("/")[2];

    const prevId = store.state.product?.productId;

    // productId가 바뀌었으면 항상 다시 로딩
    if (prevId !== productId) {
      store.clearObservers();
      loadProductDetail(productId);
    }

    DetailPage();
  }
};

async function main() {
  router.setup();

  // 최초 로드 시 URL에서 current 파라미터 제거 (새로고침 대응)
  const params = new URLSearchParams(window.location.search);
  if (params.has("current")) {
    params.delete("current");
    window.history.replaceState({}, "", `?${params.toString()}`);
  }

  render();
  router.subscribe(render);
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
