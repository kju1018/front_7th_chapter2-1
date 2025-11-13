// LocalStorage 유틸리티
export const cartStorage = {
  // shopping_cart 객체 가져오기
  getCart() {
    const cart = localStorage.getItem("shopping_cart");
    if (cart) {
      return JSON.parse(cart);
    }
    // 기본값 반환
    return {
      items: [],
      selectedAll: false,
    };
  },

  // shopping_cart 객체 저장
  saveCart(cart) {
    localStorage.setItem("shopping_cart", JSON.stringify(cart));
  },

  // items 배열 가져오기
  getItems() {
    const cart = this.getCart();
    return cart.items || [];
  },

  // selectedAll 상태 가져오기
  getSelectedAll() {
    const cart = this.getCart();
    return cart.selectedAll !== undefined ? cart.selectedAll : true;
  },

  // selectedAll 상태 저장
  setSelectedAll(selectedAll) {
    const cart = this.getCart();
    cart.selectedAll = selectedAll;
    this.saveCart(cart);
  },

  // 상품 추가 또는 수량 업데이트
  addItem(product) {
    const cart = this.getCart();
    const items = cart.items || [];
    const existingItem = items.find((item) => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += product.quantity;
    } else {
      items.push(product);
    }

    cart.items = items;
    this.saveCart(cart);
    return items;
  },

  // 상품 수량 업데이트
  updateQuantity(id, quantity) {
    const cart = this.getCart();
    const items = cart.items || [];
    const item = items.find((item) => item.id === id);

    if (item && quantity >= 1) {
      item.quantity = quantity;
      cart.items = items;
      this.saveCart(cart);
    }

    return items;
  },

  // 개별 상품 선택 상태 업데이트
  updateItemSelected(id, selected) {
    const cart = this.getCart();
    const items = cart.items || [];
    const item = items.find((item) => item.id === id);

    if (item) {
      item.selected = selected;
      cart.items = items;
      this.saveCart(cart);
    }

    return items;
  },

  // 전체 선택/해제
  toggleSelectAll(selected) {
    const cart = this.getCart();
    const items = cart.items || [];

    items.forEach((item) => {
      item.selected = selected;
    });

    cart.items = items;
    cart.selectedAll = selected;
    this.saveCart(cart);

    return items;
  },

  // 선택한 상품들 제거
  removeSelectedItems() {
    const cart = this.getCart();
    const items = cart.items || [];
    const filteredItems = items.filter((item) => !item.selected);
    cart.items = filteredItems;
    this.saveCart(cart);
    return filteredItems;
  },

  // 상품 제거
  removeItem(id) {
    const cart = this.getCart();
    const items = cart.items || [];
    const filteredItems = items.filter((item) => item.id !== id);
    cart.items = filteredItems;
    this.saveCart(cart);
    return filteredItems;
  },

  // 장바구니 전체 비우기
  clearCart() {
    const cart = {
      items: [],
      selectedAll: true,
    };
    this.saveCart(cart);
  },
};
