import { createStore } from "./createStore";

const params = new URLSearchParams(location.search);
const category1 = params.get("category1");
const category2 = params.get("category2");
const search = params.get("search");
const limit = parseInt(params.get("limit")) || 20;
const sort = params.get("sort") || "price_asc";

export const initialState = {
  search: search || "",
  pagination: { page: 1, limit, total: 0 },
  sort,
  products: [],
  categories: {},
  category1: category1 || "",
  category2: category2 || "",
  loading: true,
};

export const store = createStore(initialState);
