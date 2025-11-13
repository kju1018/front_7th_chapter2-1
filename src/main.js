import { router } from "./router.js";
import { store } from "./store/store.js";
import { HomePage } from "./pages/HomePage.js";
import { DetailPage } from "./pages/DetailPage.js";
import { NotFoundPage } from "./pages/NotFoundPage.js";
import ErrorPage from "./pages/ErrorPage.js";
import { getProducts, getCategories, getProduct } from "./api/productApi";
import { cartStorage } from "./utils/cartStorage.js";
import Toast from "./components/Toast.js";
import { Header } from "./components/Header.js";
import Cart from "./components/cart/Cart.js";

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

  // 장바구니 담기 버튼 (목록 페이지)
  if (e.target.closest(".add-to-cart-btn") && router.path === "/") {
    e.stopPropagation(); // 버블링 방지
    const productId = e.target.closest(".add-to-cart-btn").dataset.productId;
    const product = store.state.products.find((p) => p.productId == productId);

    if (product) {
      // LocalStorage에 저장할 데이터 형식
      const cartItem = {
        id: product.productId,
        title: product.title,
        image: product.image,
        price: parseInt(product.lprice),
        quantity: 1,
        selected: false,
      };

      // LocalStorage에 추가
      cartStorage.addItem(cartItem);

      // Header 다시 렌더링
      updateHeader();

      // 토스트 메시지 표시
      showToast("success");
    }
    return;
  }

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

  // 수량 감소 버튼
  if (e.target.closest("#quantity-decrease")) {
    const currentQuantity = store.state.quantity;
    if (currentQuantity > 1) {
      store.setState({ quantity: currentQuantity - 1 });
    }
  }

  // 수량 증가 버튼
  if (e.target.closest("#quantity-increase")) {
    const { quantity, product } = store.state;
    if (quantity < product.stock) {
      store.setState({ quantity: quantity + 1 });
    }
  }

  // 상세 페이지 장바구니 담기 버튼
  if (e.target.closest("#add-to-cart-btn") && router.path.startsWith("/product/")) {
    e.stopPropagation();
    const productId = e.target.closest("#add-to-cart-btn").dataset.productId;
    const { product, quantity } = store.state;

    if (product && product.productId == productId) {
      // LocalStorage에 저장할 데이터 형식
      const cartItem = {
        id: product.productId,
        title: product.title,
        image: product.image,
        price: parseInt(product.lprice),
        quantity: quantity, // 사용자가 선택한 수량
        selected: false,
      };

      // LocalStorage에 추가
      cartStorage.addItem(cartItem);

      // Header 다시 렌더링
      updateHeader();

      store.setState({ quantity: 1 });

      // 토스트 메시지 표시
      showToast("success");
    }
    return;
  }

  // 장바구니 아이콘 버튼 클릭
  if (e.target.closest("#cart-icon-btn")) {
    openCartModal();
    return;
  }

  // 장바구니 모달 닫기 버튼
  if (e.target.closest("#cart-modal-close-btn")) {
    closeCartModal();
    return;
  }

  // 모달 오버레이 클릭 시 닫기
  if (e.target.classList.contains("cart-modal-overlay")) {
    closeCartModal();
    return;
  }

  // 장바구니 수량 감소 버튼
  if (e.target.closest(".cart-quantity-decrease-btn")) {
    const productId = e.target.closest(".cart-quantity-decrease-btn").dataset.productId;
    const cart = cartStorage.getCart();
    const item = cart.items.find((item) => item.id === productId);

    if (item && item.quantity > 1) {
      cartStorage.updateQuantity(productId, item.quantity - 1);
      updateCartModal();
      updateHeader();
    }
    return;
  }

  // 장바구니 수량 증가 버튼
  if (e.target.closest(".quantity-increase-btn")) {
    const productId = e.target.closest(".quantity-increase-btn").dataset.productId;
    const cart = cartStorage.getCart();
    const item = cart.items.find((item) => item.id === productId);

    if (item) {
      cartStorage.updateQuantity(productId, item.quantity + 1);
      updateCartModal();
      updateHeader();
    }
    return;
  }

  // 장바구니 개별 상품 체크박스
  if (e.target.classList.contains("cart-item-checkbox")) {
    const productId = e.target.dataset.productId;
    const isChecked = e.target.checked;

    cartStorage.updateItemSelected(productId, isChecked);

    // 모든 아이템이 선택되었는지 확인
    const cart = cartStorage.getCart();
    const items = cart.items || [];
    const allSelected = items.length > 0 && items.every((item) => item.selected);

    // 모든 아이템이 선택되었으면 전체 선택 체크박스도 체크
    if (allSelected) {
      cartStorage.setSelectedAll(true);
    } else {
      cartStorage.setSelectedAll(false);
    }

    updateCartModal();
    return;
  }

  // 장바구니 전체 선택 체크박스
  if (e.target.id === "cart-modal-select-all-checkbox") {
    const isChecked = e.target.checked;

    cartStorage.toggleSelectAll(isChecked);
    updateCartModal();
    return;
  }

  // 선택한 상품 삭제 버튼
  if (e.target.id === "cart-modal-remove-selected-btn") {
    cartStorage.removeSelectedItems();
    updateCartModal();
    updateHeader();
    return;
  }

  // 전체 비우기 버튼
  if (e.target.id === "cart-modal-clear-cart-btn") {
    cartStorage.clearCart();
    updateCartModal();
    updateHeader();
    showToast("info");
    return;
  }

  // 구매하기 버튼
  if (e.target.id === "cart-modal-checkout-btn") {
    showToast("info", "구매 기능은 추후 구현 예정입니다.");
    return;
  }

  // 에러 페이지 다시 시도 버튼
  if (e.target.id === "retry-btn") {
    loadProducts();
    return;
  }
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
    store.setState({ categories: response });
  } catch (error) {
    console.error("카테고리 로드 실패:", error);

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
  } else if (path.startsWith("/product/")) {
    const productId = path.split("/")[2];

    const prevId = store.state.product?.productId;

    // productId가 바뀌었으면 항상 다시 로딩
    if (prevId !== productId) {
      store.clearObservers();
      // 수량 초기화
      store.setState({ quantity: 1 });
      loadProductDetail(productId);
    }

    DetailPage();
  } else {
    // 404 페이지 - 존재하지 않는 경로
    store.clearObservers();
    NotFoundPage();
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

// 장바구니 모달 열기
// 장바구니 모달 열기
function openCartModal() {
  // 이미 모달이 열려있으면 닫기
  const existingModal = document.querySelector(".cart-modal");
  if (existingModal) {
    closeCartModal();
    return;
  }

  // 모달 생성 (Cart 컴포넌트가 전체 구조를 반환)
  const modalContainer = document.createElement("div");
  modalContainer.innerHTML = Cart();
  const modal = modalContainer.firstElementChild;

  // #root 안에 추가
  const root = document.querySelector("#root");
  if (root) {
    root.appendChild(modal);
  } else {
    document.body.appendChild(modal);
  }

  document.body.style.overflow = "hidden"; // 배경 스크롤 방지
}

// 장바구니 모달 닫기
function closeCartModal() {
  const modal = document.querySelector(".cart-modal");
  if (modal) {
    modal.remove();
    document.body.style.overflow = ""; // 스크롤 복원
  }
}

// 장바구니 모달 다시 렌더링
function updateCartModal() {
  const modal = document.querySelector(".cart-modal");
  if (modal) {
    const modalContainer = document.createElement("div");
    modalContainer.innerHTML = Cart();
    const newModal = modalContainer.firstElementChild;
    modal.replaceWith(newModal);
  }
}

// 토스트 메시지 표시 함수
function showToast(type = "success", message = null) {
  const toastContainer = document.createElement("div");
  toastContainer.id = "toast-container";
  toastContainer.className = "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50";

  let toastHTML = "";

  if (type === "success") {
    toastHTML = Toast("success", message);
  } else if (type === "info") {
    toastHTML = Toast("info", message);
  } else if (type === "error") {
    toastHTML = Toast("error", message);
  }

  toastContainer.innerHTML = toastHTML;
  document.body.appendChild(toastContainer);

  // 3초 후 토스트 제거
  setTimeout(() => {
    toastContainer.remove();
  }, 3000);
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
