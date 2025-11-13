const ErrorPage = (type) => {
  if (type === "productListError") {
    //"product-list-container"에 렌더링
    return /* HTML */ `
      <div class="text-center py-12">
        <div class="text-red-500 mb-4">
          <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            ></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">오류가 발생했습니다</h3>
        <p class="text-gray-600 mb-4">Failed to fetch</p>
        <button id="retry-btn" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">다시 시도</button>
      </div>
    `;
  } else if (type === "productDetailError") {
    // main-content-view에 렌더링
    return /* HTML */ `
      <div class="min-h-screen bg-gray-50 flex items-center justify-center">
        <div class="text-center">
          <div class="text-red-500 mb-4">
            <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              ></path>
            </svg>
          </div>
          <h1 class="text-xl font-bold text-gray-900 mb-2">상품을 찾을 수 없습니다</h1>
          <p class="text-gray-600 mb-4">Failed to fetch</p>
          <button
            onclick="window.history.back()"
            class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mr-2"
          >
            이전 페이지
          </button>
          <a href="/" data-link="" class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"> 홈으로 </a>
        </div>
      </div>
    `;
  }
};

export default ErrorPage;
