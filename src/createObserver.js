export const createObserver = () => {
  const observers = new Set();

  const subscribe = (callback) => {
    if (typeof callback !== "function") {
      return;
    }
    console.log("observers", observers);
    observers.add(callback);
  };

  const notify = (payload = {}) => {
    observers.forEach((callback) => callback(payload));
  };

  // 모든 구독자 제거
  const clearObservers = () => {
    observers.clear();
  };

  return {
    subscribe,
    notify,
    clearObservers,
  };
};
