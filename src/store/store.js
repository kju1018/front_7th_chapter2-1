const params = new URLSearchParams(location.search);
const category1 = params.get("category1");
const category2 = params.get("category2");
console.log(location.search);
export const store = {
  state: {
    pagination: { page: 1, limit: 20 },
    products: [],

    categories: {},
    category1: category1 || "",
    category2: category2 || "",

    loading: category1 ? false : true,
  },
  listeners: [],

  setState(partial) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((fn) => fn());
  },

  subscribe(fn) {
    this.listeners.push(fn);
    fn();
  },
};
