import { store } from "../../store/store";
import { ProductItem } from "./ProductItem";

const Skeleton = /* html */ `
    <!-- 로딩 스켈레톤 -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      <div class="aspect-square bg-gray-200"></div>
      <div class="p-3">
        <div class="h-4 bg-gray-200 rounded mb-2"></div>
        <div class="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
        <div class="h-5 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div class="h-8 bg-gray-200 rounded"></div>
      </div>
    </div>
`;

const Loading = () => {
  return /* html */ `
    <div class="text-center py-4">
      <div class="inline-flex items-center">
        <svg class="animate-spin h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm text-gray-600">상품을 불러오는 중...</span>
      </div>
    </div>
  `;
};

const NoProducts = () => {
  return /* html */ `
    <div class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">상품을 찾을 수 없습니다</h3>
      <p class="text-sm text-gray-500 mb-4">검색 조건을 다시 확인해주세요</p>
    </div>
  `;
};

export const ProductList = () => {
  const $el = document.createElement("div");
  $el.className = "mb-6";

  const render = () => {
    const { loading, products, pagination } = store.state;
    const { total } = pagination;
    const loadedCount = products.length;
    const hasMore = loadedCount < total;

    if (!loading && products.length === 0) {
      $el.innerHTML = /* HTML */ `
        <!-- 상품 없음 -->
        <div class="mb-6" id="product-list-container">${NoProducts()}</div>
      `;
    } else {
      $el.innerHTML = /* HTML */ `
        <!-- 상품 개수 정보 -->
        <div class="mb-6" id="product-list-container">
          ${loadedCount > 0
            ? `<div class="mb-4 text-sm text-gray-600">
            총 <span class="font-medium text-gray-900">${total}개</span>의 상품
          </div>`
            : ""}
          <div class="grid grid-cols-2 gap-4 mb-6" id="products-grid">
            ${products.map(ProductItem).join("")} ${loading ? Skeleton.repeat(6) : ""}
          </div>
          <div id="scroll-trigger" class="h-4"></div>
          ${loading ? Loading() : ""}
          ${!loading && !hasMore
            ? '<div class="text-center py-4 text-sm text-gray-500">모든 상품을 확인했습니다</div>'
            : ""}
        </div>
      `;
    }
  };

  store.subscribe(render);
  render();

  return $el;
};
