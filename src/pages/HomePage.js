import { ProductList } from "../components/product/ProductList";
import { SearchForm } from "../components/search/SearchForm";
import { PageLayout } from "./PageLayout";
import { getProducts, getCategories } from "../api/productApi";
import { store } from "../store/store";

export const HomePage = () => {
  const $root = document.querySelector("#root");
  let previousCategory1 = store.state.category1;
  let previousCategory2 = store.state.category2;

  const loadPage = async () => {
    await loadCategories();
    await loadProducts();
  };

  const loadProducts = async () => {
    const { category1, category2, pagination } = store.state;
    const filters = {
      page: pagination.page,
      limit: pagination.limit,
      ...(category1 && { category1 }),
      ...(category2 && { category2 }),
    };

    store.setState({ loading: true });
    const response = await getProducts(filters);
    store.setState({
      products: response.products,
      pagination: response.pagination,
      loading: false,
    });
  };

  async function loadCategories() {
    const response = await getCategories();
    store.setState({ categories: response });
  }

  const render = () => {
    console.log("homepaage render 호출");
    $root.innerHTML = PageLayout(); // main-view가 비어있는 상태로 렌더링

    const $mainContentView = document.querySelector("#main-content-view");

    const $searchForm = SearchForm();
    const $ProductList = ProductList();

    $mainContentView.append($searchForm, $ProductList);
  };

  // 카테고리 변경 감지
  const watchCategory = () => {
    const { category1, category2 } = store.state;

    if (previousCategory1 !== category1 || previousCategory2 !== category2) {
      previousCategory1 = category1;
      previousCategory2 = category2;
      console.log("카테고리 변경 감지");
      loadProducts();
    }
  };

  render();
  loadPage();

  // 카테고리 변경 감시 시작
  store.subscribe(watchCategory);
};
