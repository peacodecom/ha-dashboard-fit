/* global __VERSION__ */

export const VERSION = typeof __VERSION__ === "undefined" ? "development" : __VERSION__;

export function readOptions(search) {
  const params = new URLSearchParams(search);
  const number = (name, min, max) => {
    const value = params.get(name);
    if (value === null || value.trim() === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
  };
  return {
    zoom: number("zoom", 0.3, 3),
    marginTop: number("marginTop", -500, 500),
    marginLeft: number("marginLeft", -500, 500),
  };
}

// Follow composed parents: ordinary contains() stops at shadow boundaries.
export function isWithin(element, ancestor) {
  for (let node = element; node; node = node.parentNode ?? node.host) {
    if (node === ancestor) return true;
  }
  return false;
}

export function startDashboardFit(win = window) {
  const doc = win.document;
  const styles = new Map();
  const eventLayers = new Set();
  let observers = [];
  let frame = null;
  let stopped = false;

  function restore(element, property, record) {
    // Do not overwrite a later change by another frontend extension.
    if (element.style.getPropertyValue(property) !== record.applied) return;
    if (record.value) element.style.setProperty(property, record.value, record.priority);
    else element.style.removeProperty(property);
  }

  function schedule() {
    if (!stopped && frame === null) frame = win.requestAnimationFrame(refresh);
  }

  function refresh() {
    if (stopped) return;
    if (frame !== null) win.cancelAnimationFrame(frame);
    frame = null;
    for (const observer of observers) observer.disconnect();
    observers = [];
    const watched = new Set();
    const watch = (root) => {
      if (!root || watched.has(root)) return;
      watched.add(root);
      const observer = new win.MutationObserver(schedule);
      observer.observe(root, { childList: true, subtree: true });
      observers.push(observer);
    };
    const descend = (root, selector) => {
      watch(root);
      const element = root?.querySelector(selector);
      watch(element?.shadowRoot);
      return element?.shadowRoot;
    };
    let root = doc;
    for (const selector of ["home-assistant", "home-assistant-main", "ha-panel-lovelace", "hui-root"]) {
      root = descend(root, selector);
      if (!root) break;
    }
    // HA versions may render the view directly or inside hui-view's shadow root.
    let sections = root?.querySelector("hui-sections-view");
    if (!sections && root) {
      const viewRoot = descend(root, "hui-view");
      sections = viewRoot?.querySelector("hui-sections-view");
    }
    watch(sections?.shadowRoot);
    const wrapper = sections?.shadowRoot?.querySelector("div.wrapper");
    const options = readOptions(win.location.search);
    const desired = new Map();
    const set = (element, property, value) => {
      if (!element || value === null) return;
      if (!desired.has(element)) desired.set(element, new Map());
      desired.get(element).set(property, String(value));
    };

    if (wrapper) {
      set(wrapper, "zoom", options.zoom);
      set(doc.body, "margin-top", options.marginTop === null ? null : `${options.marginTop}px`);
      set(wrapper, "margin-left", options.marginLeft === null ? null : `${options.marginLeft}px`);

      if (options.zoom !== null) {
        const layers = new Set();
        // Discover already-connected fixed layers, including inside card shadows.
        const scan = (scope) => {
          watch(scope);
          for (const element of scope.querySelectorAll("*")) {
            if (element.hasAttribute("data-ha-scale-fixed")) layers.add(element);
            if (element.shadowRoot) scan(element.shadowRoot);
          }
        };
        scan(wrapper);
        for (const layer of eventLayers) {
          if (!layer.isConnected) eventLayers.delete(layer);
          else if (isWithin(layer, wrapper)) layers.add(layer);
        }
        for (const layer of layers) {
          // Nested fixed layers must only cancel the wrapper zoom once.
          let parentFixed = false;
          for (const other of layers) {
            if (other !== layer && isWithin(layer, other)) { parentFixed = true; break; }
          }
          if (!parentFixed) set(layer, "zoom", 1 / options.zoom);
        }
      }
    }

    for (const [element, properties] of styles) {
      for (const [property, record] of properties) {
        if (!desired.get(element)?.has(property)) {
          restore(element, property, record);
          properties.delete(property);
        }
      }
      if (!properties.size) styles.delete(element);
    }
    for (const [element, properties] of desired) {
      if (!styles.has(element)) styles.set(element, new Map());
      const saved = styles.get(element);
      for (const [property, value] of properties) {
        if (!saved.has(property)) saved.set(property, {
          value: element.style.getPropertyValue(property),
          priority: element.style.getPropertyPriority(property),
          applied: "",
        });
        if (element.style.getPropertyValue(property) !== value) element.style.setProperty(property, value);
        saved.get(property).applied = element.style.getPropertyValue(property);
      }
    }
  }

  const connected = (event) => {
    if (!(event.detail?.element instanceof win.HTMLElement)) return;
    eventLayers.add(event.detail.element);
    schedule();
  };
  const disconnected = (event) => {
    const layer = event.detail?.element;
    eventLayers.delete(layer);
    // Restore immediately, even if the element has already left the DOM.
    const record = styles.get(layer)?.get("zoom");
    if (record) {
      restore(layer, "zoom", record);
      styles.delete(layer);
    }
    schedule();
  };
  const events = ["resize", "popstate", "location-changed"];
  for (const event of events) win.addEventListener(event, schedule);
  win.addEventListener("ha-scale-fixed-layer-connected", connected);
  win.addEventListener("ha-scale-fixed-layer-disconnected", disconnected);
  // attachShadow() itself emits no childList mutation. A low-frequency fallback
  // also handles silent history changes without monkey-patching browser APIs.
  const timer = win.setInterval(() => { if (!doc.hidden) schedule(); }, 2000);
  refresh();

  return {
    version: VERSION,
    refresh,
    disconnect() {
      stopped = true;
      win.clearInterval(timer);
      if (frame !== null) win.cancelAnimationFrame(frame);
      for (const observer of observers) observer.disconnect();
      for (const event of events) win.removeEventListener(event, schedule);
      win.removeEventListener("ha-scale-fixed-layer-connected", connected);
      win.removeEventListener("ha-scale-fixed-layer-disconnected", disconnected);
      for (const [element, properties] of styles) {
        for (const [property, record] of properties) restore(element, property, record);
      }
      styles.clear();
      eventLayers.clear();
    },
  };
}
