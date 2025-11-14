import { router } from "./router.js";
import { store } from "./store/store.js";
import { HomePage } from "./pages/HomePage.js";
import { DetailPage } from "./pages/DetailPage.js";
import { NotFoundPage } from "./pages/NotFoundPage.js";
import ErrorPage from "./pages/ErrorPage.js";
import { getProducts, getCategories, getProduct } from "./api/productApi";
import { cartStorage } from "./utils/cartStorage.js";
import { parseUrlParams, hasFilterChanged } from "./utils/urlUtils.js";
import { DEFAULT_SORT } from "./utils/constants.js";
import { openCartModal, closeCartModal, updateCartModal } from "./utils/cartModal.js";
import { showToast } from "./utils/toast.js";
import { Header } from "./components/Header.js";

const enableMocking = () =>
  import("./mocks/browser.js").then(({ worker }) =>
    worker.start({
      onUnhandledRequest: "bypass",
      serviceWorker: {
        url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
      },
    }),
  );

function pushWithParams(params) {
  params.set("current", 1); // ✅ 항상 current=1 설정
  router.push(`?${params.toString()}`);
}

// 장바구니 아이템 생성 함수
function createCartItem(product, quantity = 1) {
  return {
    id: product.productId,
    title: product.title,
    image: product.image,
    price: parseInt(product.lprice),
    quantity: quantity,
    selected: false,
  };
}

// ========== 클릭 이벤트 핸들러 함수들 ==========

// 상품 관련 핸들러
function handleAddToCartFromList(e) {
  if (!e.target.closest(".add-to-cart-btn") || router.path !== "/") return false;

  e.stopPropagation();
  const productId = e.target.closest(".add-to-cart-btn").dataset.productId;
  const product = store.state.products.find((p) => p.productId == productId);

  if (product) {
    const cartItem = createCartItem(product, 1);
    cartStorage.addItem(cartItem);
    updateHeader();
    showToast("success");
  }
  return true;
}

function handleProductCardClick(e) {
  if (!e.target.closest(".product-card")) return false;

  const productId = e.target.closest(".product-card").dataset.productId;
  router.push(`/product/${productId}`);
  return true;
}

function handleAddToCartFromDetail(e) {
  if (!e.target.closest("#add-to-cart-btn") || !router.path.startsWith("/product/")) return false;

  e.stopPropagation();
  const productId = e.target.closest("#add-to-cart-btn").dataset.productId;
  const { product, quantity } = store.state;

  if (product && product.productId == productId) {
    const cartItem = createCartItem(product, quantity);
    cartStorage.addItem(cartItem);
    updateHeader();
    store.setState({ quantity: 1 });
    showToast("success");
  }
  return true;
}

// 필터 관련 핸들러
function handleCategory1Filter(e, params) {
  if (!e.target.closest(".category1-filter-btn")) return false;

  const category1 = e.target.closest(".category1-filter-btn").dataset.category1;
  params.set("category1", category1);
  pushWithParams(params);
  return true;
}

function handleCategory2Filter(e, params) {
  if (!e.target.closest(".category2-filter-btn")) return false;

  const category1 = e.target.closest(".category2-filter-btn").dataset.category1;
  const category2 = e.target.closest(".category2-filter-btn").dataset.category2;
  params.set("category1", category1);
  params.set("category2", category2);
  pushWithParams(params);
  return true;
}

function handleBreadcrumbCategory1(e, params) {
  if (!e.target.closest('[data-breadcrumb="category1"]')) return false;

  const category1 = e.target.closest('[data-breadcrumb="category1"]').dataset.category1;
  params.set("category1", category1);
  params.delete("category2");
  pushWithParams(params);
  return true;
}

function handleBreadcrumbReset(e, params) {
  if (!e.target.closest('[data-breadcrumb="reset"]')) return false;

  params.delete("category1");
  params.delete("category2");
  pushWithParams(params);
  return true;
}

function handleBreadcrumbLink(e) {
  if (!e.target.closest(".breadcrumb-link")) return false;

  const category1 = store.state.product.category1;
  const category2 = store.state.product.category2;
  const params = new URLSearchParams(window.location.search);

  params.set("current", 1);
  if (category1) {
    params.set("category1", category1);
    if (!category2) {
      params.delete("category2");
    } else {
      params.set("category2", category2);
    }
  }
  router.push(`?${params.toString()}`);
  return true;
}

// 네비게이션 핸들러
function handleGoToProductList(e) {
  if (!e.target.closest(".go-to-product-list")) return false;

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
  return true;
}

// 수량 조절 핸들러 (상세 페이지)
function handleQuantityDecrease(e) {
  if (!e.target.closest("#quantity-decrease")) return false;

  const currentQuantity = store.state.quantity;
  if (currentQuantity > 1) {
    store.setState({ quantity: currentQuantity - 1 });
  }
  return true;
}

function handleQuantityIncrease(e) {
  if (!e.target.closest("#quantity-increase")) return false;

  const { quantity, product } = store.state;
  if (quantity < product.stock) {
    store.setState({ quantity: quantity + 1 });
  }
  return true;
}

// 장바구니 모달 핸들러
function handleCartIconClick(e) {
  if (!e.target.closest("#cart-icon-btn")) return false;

  openCartModal();
  return true;
}

function handleCartModalClose(e) {
  if (!e.target.closest("#cart-modal-close-btn")) return false;

  closeCartModal();
  return true;
}

function handleCartOverlayClick(e) {
  if (!e.target.classList.contains("cart-modal-overlay")) return false;

  closeCartModal();
  return true;
}

// 장바구니 수량 핸들러
function handleCartQuantityDecrease(e) {
  if (!e.target.closest(".cart-quantity-decrease-btn")) return false;

  const productId = e.target.closest(".cart-quantity-decrease-btn").dataset.productId;
  const cart = cartStorage.getCart();
  const item = cart.items.find((item) => item.id === productId);

  if (item && item.quantity > 1) {
    cartStorage.updateQuantity(productId, item.quantity - 1);
    updateCartModal();
    updateHeader();
  }
  return true;
}

function handleCartQuantityIncrease(e) {
  if (!e.target.closest(".quantity-increase-btn")) return false;

  const productId = e.target.closest(".quantity-increase-btn").dataset.productId;
  const cart = cartStorage.getCart();
  const item = cart.items.find((item) => item.id === productId);

  if (item) {
    cartStorage.updateQuantity(productId, item.quantity + 1);
    updateCartModal();
    updateHeader();
  }
  return true;
}

// 장바구니 체크박스 핸들러
function handleCartItemCheckbox(e) {
  if (!e.target.classList.contains("cart-item-checkbox")) return false;

  const productId = e.target.dataset.productId;
  const isChecked = e.target.checked;

  cartStorage.updateItemSelected(productId, isChecked);

  const cart = cartStorage.getCart();
  const items = cart.items || [];
  const allSelected = items.length > 0 && items.every((item) => item.selected);

  if (allSelected) {
    cartStorage.setSelectedAll(true);
  } else {
    cartStorage.setSelectedAll(false);
  }

  updateCartModal();
  return true;
}

function handleCartSelectAllCheckbox(e) {
  if (e.target.id !== "cart-modal-select-all-checkbox") return false;

  const isChecked = e.target.checked;
  cartStorage.toggleSelectAll(isChecked);
  updateCartModal();
  return true;
}

// 장바구니 삭제 핸들러
function handleCartItemRemove(e) {
  if (!e.target.classList.contains("cart-item-remove-btn")) return false;

  const productId = e.target.dataset.productId;
  cartStorage.removeItem(productId);
  updateCartModal();
  updateHeader();
  return true;
}

function handleCartRemoveSelected(e) {
  if (e.target.id !== "cart-modal-remove-selected-btn") return false;

  cartStorage.removeSelectedItems();
  updateCartModal();
  updateHeader();
  showToast("info", "선택된 상품들이 삭제되었습니다");
  return true;
}

function handleCartClear(e) {
  if (e.target.id !== "cart-modal-clear-cart-btn") return false;

  cartStorage.clearCart();
  updateCartModal();
  updateHeader();
  showToast("info");
  return true;
}

// 기타 핸들러
function handleCheckout(e) {
  if (e.target.id !== "cart-modal-checkout-btn") return false;

  showToast("info", "구매 기능은 추후 구현 예정입니다.");
  return true;
}

function handleRetry(e) {
  if (e.target.id !== "retry-btn") return false;

  if (store.state.categoryError) {
    loadCategories().then(() => {
      if (!store.state.categoryError) {
        loadProducts();
      }
    });
  } else {
    loadProducts();
  }
  return true;
}

// 메인 클릭 이벤트 리스너
document.body.addEventListener("click", (e) => {
  const params = new URLSearchParams(window.location.search);

  // 상품 관련
  if (handleAddToCartFromList(e)) return;
  if (handleProductCardClick(e)) return;
  if (handleAddToCartFromDetail(e)) return;

  // 필터 관련
  if (handleCategory1Filter(e, params)) return;
  if (handleCategory2Filter(e, params)) return;
  if (handleBreadcrumbCategory1(e, params)) return;
  if (handleBreadcrumbReset(e, params)) return;
  if (handleBreadcrumbLink(e)) return;

  // 네비게이션
  if (handleGoToProductList(e)) return;

  // 수량 조절
  if (handleQuantityDecrease(e)) return;
  if (handleQuantityIncrease(e)) return;

  // 장바구니 모달
  if (handleCartIconClick(e)) return;
  if (handleCartModalClose(e)) return;
  if (handleCartOverlayClick(e)) return;

  // 장바구니 수량
  if (handleCartQuantityDecrease(e)) return;
  if (handleCartQuantityIncrease(e)) return;

  // 장바구니 체크박스
  if (handleCartItemCheckbox(e)) return;
  if (handleCartSelectAllCheckbox(e)) return;

  // 장바구니 삭제
  if (handleCartItemRemove(e)) return;
  if (handleCartRemoveSelected(e)) return;
  if (handleCartClear(e)) return;

  // 기타
  if (handleCheckout(e)) return;
  if (handleRetry(e)) return;
});

document.body.addEventListener("change", (e) => {
  // 장바구니 수량 직접 입력
  if (e.target.classList.contains("cart-quantity-input")) {
    const productId = e.target.dataset.productId;
    const newQuantity = parseInt(e.target.value) || 1;

    if (newQuantity >= 1) {
      cartStorage.updateQuantity(productId, newQuantity);
      updateCartModal();
      updateHeader();
    } else {
      // 유효하지 않은 값이면 원래 값으로 복원
      const cart = cartStorage.getCart();
      const item = cart.items.find((item) => item.id === productId);
      if (item) {
        e.target.value = item.quantity;
      }
    }
    return;
  }

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

// 수량 입력 이벤트
document.body.addEventListener("input", (e) => {
  if (e.target.id === "quantity-input") {
    const newQuantity = parseInt(e.target.value) || 1;
    store.setState({ quantity: newQuantity });
  }
});

document.body.addEventListener("change", (e) => {
  if (e.target.id === "quantity-input") {
    const newQuantity = parseInt(e.target.value) || 1;
    store.setState({ quantity: newQuantity });
  }
});

document.body.addEventListener("keydown", (e) => {
  // ESC 키로 장바구니 모달 닫기
  if (e.key === "Escape") {
    const cartModal = document.querySelector(".cart-modal");
    if (cartModal) {
      closeCartModal();
      return;
    }
  }

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
    sort: params.get("sort") || DEFAULT_SORT,
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
  // 카테고리 에러가 있으면 상품 목록을 로드하지 않음
  if (store.state.categoryError) {
    return;
  }

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
  try {
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
  } catch (error) {
    console.error("상품 목록 로드 실패:", error);
    store.setState({ loading: false });

    // product-list-container에 에러 페이지 렌더링
    const productListContainer = document.querySelector("#product-list-container");
    if (productListContainer) {
      productListContainer.innerHTML = ErrorPage("productListError");
    }
  }
};

const loadCategories = async () => {
  try {
    const response = await getCategories();
    store.setState({ categories: response, categoryError: false });
  } catch (error) {
    console.error("카테고리 로드 실패:", error);
    store.setState({ categoryError: true });

    // product-list-container에 에러 페이지 렌더링
    const productListContainer = document.querySelector("#product-list-container");
    if (productListContainer) {
      productListContainer.innerHTML = ErrorPage("productListError");
    }
  }
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

    // main-content-view에 에러 페이지 렌더링
    const mainContentView = document.querySelector("#main-content-view");
    if (mainContentView) {
      mainContentView.innerHTML = ErrorPage("productDetailError");
    }
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

// ========== 렌더링 관련 함수들 ==========

// 홈 페이지 렌더링 로직
async function renderHomePage(isQueryOnly, filterChanged) {
  if (!isQueryOnly) {
    // 모든 이전 구독 해제
    store.clearObservers();
    // 수량 초기화
    store.setState({ quantity: 1 });
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
}

// 상품 상세 페이지 렌더링 로직
async function renderProductDetailPage(productId) {
  const prevId = store.state.product?.productId;

  // productId가 바뀌었으면 항상 다시 로딩
  if (prevId !== productId) {
    store.clearObservers();
    // 수량 초기화
    store.setState({ quantity: 1 });
    loadProductDetail(productId);
  }

  DetailPage();
}

// 404 페이지 렌더링 로직
function renderNotFoundPage() {
  store.clearObservers();
  NotFoundPage();
}

// 라우터 초기 세팅
const render = async ({ isQueryOnly = false } = {}) => {
  // 1. URL 파라미터 파싱 및 필터 변경 감지 (동기화 전에 비교해야 함)
  const urlParams = parseUrlParams(DEFAULT_SORT);
  const filterChanged = hasFilterChanged(store.state, urlParams);

  // 2. 상태 동기화
  syncStateFromUrl();

  // 3. 라우팅에 따른 페이지 렌더링
  const path = router.path;

  if (path === "/") {
    await renderHomePage(isQueryOnly, filterChanged);
  } else if (path.startsWith("/product/")) {
    const productId = path.split("/")[2];
    await renderProductDetailPage(productId);
  } else {
    renderNotFoundPage();
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

// Header 다시 렌더링 함수
function updateHeader() {
  const headerElement = document.querySelector("header");
  if (headerElement) {
    headerElement.outerHTML = Header();
  }
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
