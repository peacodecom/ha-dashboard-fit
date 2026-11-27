/*! HA Dashboard Fit v0.1.0 | Published by peacode (https://peacode.com)
MIT License

Copyright (c) 2026 Norman Bauer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
(() => {
  // src/ha-dashboard-fit.js
  var VERSION = false ? "development" : "0.1.0";
  function readOptions(search) {
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
      marginLeft: number("marginLeft", -500, 500)
    };
  }
  function isWithin(element, ancestor) {
    for (let node = element; node; node = node.parentNode ?? node.host) {
      if (node === ancestor) return true;
    }
    return false;
  }
  function findZoomTarget(root, watch = () => {
  }) {
    if (!root) return null;
    const selector = "hui-sections-view, hui-masonry-view, hui-panel-view";
    const view = root.querySelector("hui-view");
    const scope = view?.shadowRoot ?? view ?? root;
    watch(scope);
    const layout = view ? Array.from(scope.children).find((element) => element.matches(selector)) : scope.querySelector(selector);
    if (!layout) return null;
    watch(layout);
    watch(layout.shadowRoot);
    if (!layout.shadowRoot) return null;
    if (layout.localName === "hui-sections-view") {
      return layout.shadowRoot.querySelector("div.wrapper");
    }
    return layout;
  }
  function startDashboardFit(win = window) {
    const doc = win.document;
    const styles = /* @__PURE__ */ new Map();
    const eventLayers = /* @__PURE__ */ new Set();
    let observers = [];
    let frame = null;
    let stopped = false;
    function restore(element, property, record) {
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
      const watched = /* @__PURE__ */ new Set();
      const watch = (root2) => {
        if (!root2 || watched.has(root2)) return;
        watched.add(root2);
        const observer = new win.MutationObserver(schedule);
        observer.observe(root2, { childList: true, subtree: true });
        observers.push(observer);
      };
      const descend = (root2, selector) => {
        watch(root2);
        const element = root2?.querySelector(selector);
        watch(element?.shadowRoot);
        return element?.shadowRoot;
      };
      let root = doc;
      for (const selector of ["home-assistant", "home-assistant-main", "ha-panel-lovelace", "hui-root"]) {
        root = descend(root, selector);
        if (!root) break;
      }
      const target = findZoomTarget(root, watch);
      const options = readOptions(win.location.search);
      const desired = /* @__PURE__ */ new Map();
      const set = (element, property, value) => {
        if (!element || value === null) return;
        if (!desired.has(element)) desired.set(element, /* @__PURE__ */ new Map());
        desired.get(element).set(property, String(value));
      };
      if (target) {
        set(target, "zoom", options.zoom);
        set(doc.body, "margin-top", options.marginTop === null ? null : `${options.marginTop}px`);
        set(target, "margin-left", options.marginLeft === null ? null : `${options.marginLeft}px`);
        if (options.zoom !== null) {
          const layers = /* @__PURE__ */ new Set();
          const scan = (scope) => {
            watch(scope);
            if (scope.shadowRoot) scan(scope.shadowRoot);
            for (const element of scope.querySelectorAll("*")) {
              if (element.hasAttribute("data-ha-scale-fixed")) layers.add(element);
              if (element.shadowRoot) scan(element.shadowRoot);
            }
          };
          scan(target);
          for (const layer of eventLayers) {
            if (!layer.isConnected) eventLayers.delete(layer);
            else if (isWithin(layer, target) && layer !== target) layers.add(layer);
          }
          for (const layer of layers) {
            let parentFixed = false;
            for (const other of layers) {
              if (other !== layer && isWithin(layer, other)) {
                parentFixed = true;
                break;
              }
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
        if (!styles.has(element)) styles.set(element, /* @__PURE__ */ new Map());
        const saved = styles.get(element);
        for (const [property, value] of properties) {
          if (!saved.has(property)) saved.set(property, {
            value: element.style.getPropertyValue(property),
            priority: element.style.getPropertyPriority(property),
            applied: ""
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
    const timer = win.setInterval(() => {
      if (!doc.hidden) schedule();
    }, 2e3);
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
      }
    };
  }

  // src/index.js
  window.haDashboardFit?.disconnect?.();
  window.haDashboardFit = startDashboardFit();
})();
