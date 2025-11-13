import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  // 개발/테스트 환경에서는 base를 "/"로, 배포 환경에서는 "/front_7th_chapter2-1/"로 설정
  const base = mode === "production" ? "/front_7th_chapter2-1/" : "/";

  return {
    base,
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.js",
      exclude: ["**/e2e/**", "**/*.e2e.spec.js", "**/*.node_modules/**"],
      poolOptions: {
        threads: {
          singleThread: true,
        },
      },
    },
  };
});
