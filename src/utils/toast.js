import Toast from "../components/Toast.js";
import { TOAST_DURATION } from "./constants.js";

export function showToast(type = "success", message = null) {
  // 기존 토스트 제거 (중복 생성 방지)
  const existingToast = document.querySelector("#toast-container");
  if (existingToast) {
    existingToast.remove();
  }

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

  const toastTimer = setTimeout(() => {
    toastContainer.remove();
  }, TOAST_DURATION);

  const closeBtn = toastContainer.querySelector("#toast-close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      clearTimeout(toastTimer);
      toastContainer.remove();
    });
  }
}
