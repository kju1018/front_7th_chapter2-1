import { createObserver } from "../createObserver";
export const createStore = (initialState) => {
  const { notify, subscribe, clearObservers } = createObserver();
  let state = initialState;

  const setState = (partial) => {
    state = { ...state, ...partial };
    notify();
  };

  return {
    get state() {
      return state;
    },
    subscribe,
    setState,
    clearObservers,
  };
};
