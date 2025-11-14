import Cart from "../components/cart/Cart.js";

// 장바구니 모달 열기
export function openCartModal() {
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
export function closeCartModal() {
  const modal = document.querySelector(".cart-modal");
  if (modal) {
    modal.remove();
    document.body.style.overflow = ""; // 스크롤 복원
  }
}

// 장바구니 모달 다시 렌더링
export function updateCartModal() {
  const modal = document.querySelector(".cart-modal");
  if (modal) {
    const modalContainer = document.createElement("div");
    modalContainer.innerHTML = Cart();
    const newModal = modalContainer.firstElementChild;
    modal.replaceWith(newModal);
  }
}
