// const SCROLL_ANIMATION_TRIGGER_CLASSNAME = "scroll-trigger";
// const SCROLL_ANIMATION_OFFSCREEN_CLASSNAME = "scroll-trigger--offscreen";
// const SCROLL_ZOOM_IN_TRIGGER_CLASSNAME = "animate--zoom-in";
// const SCROLL_ANIMATION_CANCEL_CLASSNAME = "scroll-trigger--cancel";

// // Scroll in animation logic
// // Scroll in animation logic for dont use Lenis

// if (typeof window.Lenis === "undefined") {
//   // function onIntersection(elements, observer) {
//   //   elements.forEach((element, index) => {
//   //     if (element.isIntersecting) {
//   //       const elementTarget = element.target;
//   //       if (
//   //         elementTarget.classList.contains(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME)
//   //       ) {
//   //         elementTarget.classList.remove(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME);
//   //         if (elementTarget.hasAttribute("data-cascade"))
//   //           elementTarget.setAttribute("style", `--animation-order: ${index};`);
//   //       }
//   //     } else {
//   //       element.target.classList.add(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME);
//   //       element.target.classList.remove(SCROLL_ANIMATION_CANCEL_CLASSNAME);
//   //     }
//   //   });
//   // }

//   // function initializeScrollAnimationTrigger(
//   //   rootEl = document,
//   //   isDesignModeEvent = false
//   // ) {
//   //   const animationTriggerElements = Array.from(
//   //     rootEl.getElementsByClassName(SCROLL_ANIMATION_TRIGGER_CLASSNAME)
//   //   );
//   //   if (animationTriggerElements.length === 0) return;

//   //   if (isDesignModeEvent) {
//   //     animationTriggerElements.forEach((element) => {
//   //       element.classList.add("scroll-trigger--design-mode");
//   //     });
//   //     return;
//   //   }

//   //   const observer = new IntersectionObserver(onIntersection, {
//   //     rootMargin: "0px 0px -50px 0px",
//   //   });
//   //   animationTriggerElements.forEach((element) => observer.observe(element));
//   // }

//   // // Zoom in animation logic
//   // function initializeScrollZoomAnimationTrigger() {
//   //   if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

//   //   const animationTriggerElements = Array.from(
//   //     document.getElementsByClassName(SCROLL_ZOOM_IN_TRIGGER_CLASSNAME)
//   //   );

//   //   if (animationTriggerElements.length === 0) return;

//   //   const scaleAmount = 0.2 / 100;

//   //   animationTriggerElements.forEach((element) => {
//   //     let elementIsVisible = false;
//   //     const observer = new IntersectionObserver((elements) => {
//   //       elements.forEach((entry) => {
//   //         elementIsVisible = entry.isIntersecting;
//   //       });
//   //     });
//   //     observer.observe(element);

//   //     element.style.setProperty(
//   //       "--zoom-in-ratio",
//   //       1 + scaleAmount * percentageSeen(element)
//   //     );

//   //     window.addEventListener(
//   //       "scroll",
//   //       throttle(() => {
//   //         if (!elementIsVisible) return;

//   //         element.style.setProperty(
//   //           "--zoom-in-ratio",
//   //           1 + scaleAmount * percentageSeen(element)
//   //         );
//   //       }),
//   //       { passive: true }
//   //     );
//   //   });
//   // }

//   // function percentageSeen(element) {
//   //   const viewportHeight = window.innerHeight;
//   //   const scrollY = window.scrollY;
//   //   const elementPositionY = element.getBoundingClientRect().top + scrollY;
//   //   const elementHeight = element.offsetHeight;

//   //   if (elementPositionY > scrollY + viewportHeight) {
//   //     // If we haven't reached the image yet
//   //     return 0;
//   //   } else if (elementPositionY + elementHeight < scrollY) {
//   //     // If we've completely scrolled past the image
//   //     return 100;
//   //   }

//   //   // When the image is in the viewport
//   //   const distance = scrollY + viewportHeight - elementPositionY;
//   //   let percentage = distance / ((viewportHeight + elementHeight) / 100);
//   //   return Math.round(percentage);
//   // }

//   // window.addEventListener("DOMContentLoaded", () => {
//   //   initializeScrollAnimationTrigger();
//   //   initializeScrollZoomAnimationTrigger();
//   // });

//   // if (Shopify.designMode) {
//   //   document.addEventListener("shopify:section:load", (event) =>
//   //     initializeScrollAnimationTrigger(event.target, true)
//   //   );
//   //   document.addEventListener("shopify:section:reorder", () =>
//   //     initializeScrollAnimationTrigger(document, true)
//   //   );
//   // }
// } else {
//   // Scroll trigger for items with class 'SCROLL_ANIMATION_TRIGGER_CLASSNAME' using Lenis
//   function initializeLenisScrollTrigger() {
//     // Check if Lenis is available
//     if (typeof window.Lenis === "undefined") return;

//     // Helper: intersection observer fallback for browsers without support
//     function observeWithFallback(items, callback) {
//       if ("IntersectionObserver" in window) {
//         let observer = new IntersectionObserver(
//           (entries) => {
//             entries.forEach((entry) => {
//               if (entry.isIntersecting) {
//                 callback(entry.target);
//                 observer.unobserve(entry.target);
//               }
//             });
//           },
//           {
//             threshold: 0.2, // trigger when 20% of item visible
//           }
//         );
//         items.forEach((item) => observer.observe(item));
//       } else {
//         // fallback: listen to scroll
//         let triggered = new Set();
//         function check() {
//           items.forEach((item) => {
//             if (triggered.has(item)) return;
//             const rect = item.getBoundingClientRect();
//             if (rect.top < window.innerHeight && rect.bottom > 0) {
//               callback(item);
//               triggered.add(item);
//             }
//           });
//         }
//         window.addEventListener("scroll", check, { passive: true });
//         check();
//       }
//     }

//     // Handler: add --scrolled-in class when in view
//     function triggerScrollItem(item) {
//       item.classList.add("is-scrolltrigger");
//     }

//     // Get all scrolltrigger items
//   let scrollItems = Array.from(
//       document.getElementsByClassName(SCROLL_ANIMATION_TRIGGER_CLASSNAME)
//     );

//     // Early exit
//     if (!scrollItems.length) return;

//     // Attach observer/fallback
//     observeWithFallback(scrollItems, triggerScrollItem);

//     // Listen for custom lenis scroll event
//     if (window.lenis && typeof window.lenis.on === "function") {
//       window.lenis.on("scroll", () => {
//         // Run fallback check for browsers that don't support IntersectionObserver
//         // (Or to ensure update on smooth scroll)
//         scrollItems.forEach((item) => {
//           if (item.classList.contains("is-scrolltrigger")) return;
//           const rect = item.getBoundingClientRect();
//           if (rect.top < window.innerHeight && rect.bottom > 0) {
//             item.classList.add("is-scrolltrigger");
//           }
//         });
//       });
//     }
//   }

//   // Initialize on ready
//   window.addEventListener("DOMContentLoaded", initializeLenisScrollTrigger);

//   // Re-run on Shopify section load (if relevant)
//   if (window.Shopify && Shopify.designMode) {
//     document.addEventListener("shopify:section:load", (e) =>
//       initializeLenisScrollTrigger()
//     );
//     document.addEventListener("shopify:section:reorder", () =>
//       initializeLenisScrollTrigger()
//     );
//   }
// }
