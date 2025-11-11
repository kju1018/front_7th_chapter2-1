import { store } from "../../store/store";

export const CategoryFilter = () => {
  const $el = document.createElement("div");
  $el.className = "space-y-2";

  const render = () => {
    const { loading, categories, category1, category2 } = store.state;

    $el.innerHTML = /* HTML */ `
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600">카테고리:</label>
          <button data-breadcrumb="reset" class="text-xs hover:text-blue-800 hover:underline">전체</button>
          ${category1 &&
          /* HTML */ `<span class="text-xs text-gray-500">&gt;</span>
            <button
              data-breadcrumb="category1"
              data-category1="생활/건강"
              class="text-xs hover:text-blue-800 hover:underline"
            >
              생활/건강
            </button>`}
          ${category2 &&
          /* HTML */ `
            <span class="text-xs text-gray-500">&gt;</span>
            <span class="text-xs text-gray-600 cursor-default">${category2}</span>
          `}
        </div>
        <div class="space-y-2">
          ${!category1 && loading
            ? /* HTML */ `<div class="text-sm text-gray-500 italic">카테고리 로딩 중...</div>`
            : category1 && categories[category1]
              ? /* HTML */ `${Object.keys(categories[category1])
                  .map(
                    (cat2) => /* HTML */ `
                      <button
                        data-category1="${category1}"
                        data-category2="${cat2}"
                        class="category2-filter-btn text-left px-3 py-2 text-sm rounded-md border transition-colors ${cat2 ===
                        category2
                          ? "bg-blue-100 border-blue-300 text-blue-800"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}"
                      >
                        ${cat2}
                      </button>
                    `,
                  )
                  .join("")}`
              : !category1 && Object.keys(categories).length > 0
                ? /* HTML */ `${Object.keys(categories)
                    .map(
                      (cat1) => /* HTML */ `
                        <button
                          data-category1="${cat1}"
                          class="category1-filter-btn text-left px-3 py-2 text-sm rounded-md border transition-colors ${cat1 ===
                          category1
                            ? "bg-blue-100 border-blue-300 text-blue-800"
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}"
                        >
                          ${cat1}
                        </button>
                      `,
                    )
                    .join("")}`
                : /* HTML */ ``}
        </div>
      </div>
    `;
  };

  store.subscribe(render);
  return $el;
};
