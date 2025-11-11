// export const createRouter = () => {
//   const { notify, subscribe} = createObserver();

//   const push = (path) => {
//     window.history.pushState(null, "", path);
//     notify(path);
//   };

//   const setup = () => {
//     window.addEventListener("popstate", () => {
//       console.log("popstate");
//     });
//   };
//   return {
//     push,
//     setup,
//   };
// };
