/* Loader kept small so issue #50 stays isolated from the existing v28 choice implementation. */
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
