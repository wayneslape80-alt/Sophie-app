/* Wave 1 + issue #50 release integration loader.
 * Loads the accepted Wave 1 technique-choice implementation, then the accepted School status modules.
 */
(() => {
  function load(src, onload) {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    if (onload) script.addEventListener("load", onload, { once: true });
    script.addEventListener("error", () => console.error(`Could not load ${src}`), { once: true });
    document.head.appendChild(script);
  }

  load("./assets/skill-pathways-v28-choice-core.js", () =>
    load("./assets/issue50-school-status.js", () =>
      load("./assets/issue50-school-status-focus.js")
    )
  );
})();
