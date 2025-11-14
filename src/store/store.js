import { createStore } from "./createStore";
import { DEFAULT_SORT } from "../utils/constants.js";

const params = new URLSearchParams(location.search);
const category1 = params.get("category1");
const category2 = params.get("category2");
const search = params.get("search");
const limit = parseInt(params.get("limit")) || 20;
const sort = params.get("sort") || DEFAULT_SORT;

export const initialState = {
  search: search || "",
  pagination: { page: 1, limit, total: 0 },
  sort,
  products: [],
  categories: {},
  category1: category1 || "",
  category2: category2 || "",
  loading: true,
  product: {
    title: "",
    link: "",
    image: "",
    lprice: "",
    hprice: "",
    mallName: "",
    productId: "",
    productType: "",
    brand: "",
    maker: "",
    category1: "",
    category2: "",
    category3: "",
    category4: "",
    description: "",
    rating: 0,
    reviewCount: 0,
    stock: 0,
    images: [],
  },
  relatedProducts: [],
  quantity: 1, // 상품 수량
  categoryError: false, // 카테고리 에러 상태
};

export const store = createStore(initialState);
