import { DEFAULT_SORT } from "./constants.js";

// URL 파라미터 파싱 함수
export function parseUrlParams(defaultSort = DEFAULT_SORT) {
  const params = new URLSearchParams(window.location.search);
  return {
    category1: params.get("category1") || "",
    category2: params.get("category2") || "",
    limit: parseInt(params.get("limit")) || 20,
    search: params.get("search") || "",
    sort: params.get("sort") || defaultSort,
  };
}

// 필터 변경 감지 함수
export function hasFilterChanged(currentState, urlParams) {
  return (
    currentState.category1 !== urlParams.category1 ||
    currentState.category2 !== urlParams.category2 ||
    currentState.pagination.limit !== urlParams.limit ||
    currentState.search !== urlParams.search ||
    currentState.sort !== urlParams.sort
  );
}
