import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { Window } from "happy-dom";
import { findZoomTarget, isWithin, readOptions, startDashboardFit } from "../src/ha-dashboard-fit.js";

function fixture(t, search = "?zoom=0.85&marginTop=-15", layout = "sections", boundary = "direct") {
  const win = new Window({ url: `https://ha.example.test/dashboard-tablet/home${search}` });
  const appendShadow = (parent, name) => {
    const host = win.document.createElement(name);
    parent.append(host);
    return host.attachShadow({ mode: "open" });
  };
  let root = win.document.body;
  for (const name of ["home-assistant", "home-assistant-main", "ha-panel-lovelace", "hui-root"]) {
    root = appendShadow(root, name);
  }
  let layoutParent = root;
  if (boundary === "shadow") layoutParent = appendShadow(root, "hui-view");
  else if (boundary === "light") {
    layoutParent = win.document.createElement("hui-view");
    root.append(layoutParent);
  }
  const sectionsRoot = appendShadow(layoutParent, `hui-${layout}-view`);
  const wrapper = win.document.createElement("div");
  if (layout === "sections") wrapper.className = "wrapper";
  else if (layout === "masonry") wrapper.id = "columns";
  sectionsRoot.append(wrapper);
  const target = layout === "sections" ? wrapper : sectionsRoot.host;
  const controller = startDashboardFit(win);
  t.after(async () => { controller.disconnect(); await win.happyDOM.close(); });
  const navigate = (query) => {
    win.history.pushState({}, "", `/dashboard-tablet/home${query}`);
    controller.refresh();
  };
  return { win, root, wrapper, target, sectionsRoot, controller, navigate, appendShadow };
}

test("reads the Fully Kiosk tablet example", () => {
  assert.deepEqual(readOptions("?zoom=0.85&marginTop=-15"), { zoom: 0.85, marginTop: -15, marginLeft: null });
});

test("accepts combined Kiosk Mode parameters without modifying the URL", (t) => {
  const query = "?kiosk&zoom=0.85&marginTop=-15";
  const { win, wrapper } = fixture(t, query);
  assert.deepEqual(readOptions(query), { zoom: 0.85, marginTop: -15, marginLeft: null });
  assert.equal(win.location.search, query);
  assert.equal(wrapper.style.zoom, "0.85");
  assert.equal(win.document.body.style.marginTop, "-15px");
});

test("all parameters are optional", () => {
  assert.deepEqual(readOptions("?unrelated=true"), { zoom: null, marginTop: null, marginLeft: null });
});

test("inclusive limits and zero offsets", () => {
  assert.deepEqual(readOptions("?zoom=0.3&marginTop=-500&marginLeft=500"), { zoom: 0.3, marginTop: -500, marginLeft: 500 });
  assert.deepEqual(readOptions("?zoom=3&marginTop=0&marginLeft=0"), { zoom: 3, marginTop: 0, marginLeft: 0 });
});

for (const invalid of ["", " ", "0.85junk", "NaN", "Infinity", "-Infinity", "0", "3.01", "0.29"]) {
  test(`ignores invalid zoom ${JSON.stringify(invalid)}`, () => {
    assert.equal(readOptions(`?zoom=${encodeURIComponent(invalid)}`).zoom, null);
  });
}

test("ignores out-of-range offsets independently", () => {
  assert.deepEqual(readOptions("?zoom=.85&marginTop=-501&marginLeft=501"), { zoom: .85, marginTop: null, marginLeft: null });
});

test("applies zoom only to the Sections wrapper and offset to body", (t) => {
  const { win, wrapper } = fixture(t);
  assert.equal(wrapper.style.zoom, "0.85");
  assert.equal(win.document.body.style.marginTop, "-15px");
  assert.equal(win.document.body.style.zoom, "");
  assert.equal(win.document.documentElement.style.zoom, "");
});

test("does not style anything without URL parameters", (t) => {
  const { win, wrapper } = fixture(t, "");
  assert.equal(wrapper.getAttribute("style"), null);
  assert.equal(win.document.body.getAttribute("style"), null);
});

test("updates parameters and resets removed properties on navigation", (t) => {
  const { win, wrapper, navigate } = fixture(t);
  navigate("?zoom=1.2&marginLeft=12");
  assert.equal(wrapper.style.zoom, "1.2");
  assert.equal(wrapper.style.marginLeft, "12px");
  assert.equal(win.document.body.style.marginTop, "");
  navigate("");
  assert.equal(wrapper.style.zoom, "");
  assert.equal(wrapper.style.marginLeft, "");
});

test("restores previous inline values and priorities", (t) => {
  const { wrapper, win, navigate } = fixture(t, "");
  wrapper.style.setProperty("zoom", "1.1", "important");
  win.document.body.style.marginTop = "8px";
  navigate("?zoom=.85&marginTop=-15");
  navigate("");
  assert.equal(wrapper.style.zoom, "1.1");
  assert.equal(wrapper.style.getPropertyPriority("zoom"), "important");
  assert.equal(win.document.body.style.marginTop, "8px");
});

test("does not overwrite later external changes during cleanup", (t) => {
  const { wrapper, navigate } = fixture(t);
  wrapper.style.zoom = "1.4";
  navigate("");
  assert.equal(wrapper.style.zoom, "1.4");
});

test("restores styles on the old wrapper when HA replaces it", (t) => {
  const { win, wrapper, sectionsRoot, controller } = fixture(t);
  const replacement = win.document.createElement("div");
  replacement.className = "wrapper";
  sectionsRoot.replaceChildren(replacement);
  controller.refresh();
  assert.equal(wrapper.style.zoom, "");
  assert.equal(replacement.style.zoom, "0.85");
});

test("restores body offset outside a supported dashboard", (t) => {
  const { root, wrapper, win, controller } = fixture(t);
  root.replaceChildren(win.document.createElement("hui-sidebar-view"));
  controller.refresh();
  assert.equal(wrapper.style.zoom, "");
  assert.equal(win.document.body.style.marginTop, "");
});

test("supports a hui-view shadow boundary", (t) => {
  const { root, wrapper, sectionsRoot, appendShadow, controller } = fixture(t);
  const sections = sectionsRoot.host;
  sections.remove();
  appendShadow(root, "hui-view").append(sections);
  controller.refresh();
  assert.equal(wrapper.style.zoom, "0.85");
});

for (const layout of ["sections", "masonry", "panel"]) {
  for (const boundary of ["direct", "light", "shadow"]) {
    test(`${layout} zooms its content target with a ${boundary} view boundary`, (t) => {
      const { target, root, win } = fixture(t, "?zoom=.85&marginTop=-15&marginLeft=7", layout, boundary);
      assert.equal(findZoomTarget(root), target);
      assert.equal(target.style.zoom, "0.85");
      assert.equal(target.style.marginLeft, "7px");
      assert.equal(win.document.body.style.marginTop, "-15px");
      assert.equal(root.host.style.zoom, "");
    });
  }

  test(`${layout} discovers fixed layers and leaves outside dialogs unscaled`, (t) => {
    const { target, sectionsRoot, root, win, navigate, controller, appendShadow } = fixture(t, "?zoom=.85", layout, "light");
    const content = layout === "sections" ? target : sectionsRoot;
    const card = appendShadow(content, "test-card");
    const layer = win.document.createElement("div");
    layer.setAttribute("data-ha-scale-fixed", "");
    card.append(layer);
    const dialog = win.document.createElement("ha-dialog");
    root.append(dialog);
    controller.refresh();
    assert.equal(Number(layer.style.zoom), 1 / .85);
    assert.equal(dialog.style.zoom, "");
    assert.equal(isWithin(dialog, target), false);
    navigate("");
    assert.equal(target.style.zoom, "");
    assert.equal(layer.style.zoom, "");
  });

  test(`${layout} restores pre-existing target styles`, (t) => {
    const { target, navigate } = fixture(t, "", layout);
    target.style.setProperty("zoom", "1.1", "important");
    target.style.marginLeft = "3px";
    navigate("?zoom=.85&marginLeft=-5");
    navigate("");
    assert.equal(target.style.zoom, "1.1");
    assert.equal(target.style.getPropertyPriority("zoom"), "important");
    assert.equal(target.style.marginLeft, "3px");
  });
}

test("Masonry scales badges and columns together, not the app header", (t) => {
  const { target, sectionsRoot, wrapper, root, win } = fixture(t, "?zoom=.85", "masonry");
  const badges = win.document.createElement("hui-view-badges");
  sectionsRoot.prepend(badges);
  const header = win.document.createElement("div");
  header.className = "header";
  root.prepend(header);
  assert.equal(isWithin(badges, target), true);
  assert.equal(isWithin(wrapper, target), true);
  assert.equal(isWithin(header, target), false);
  assert.equal(wrapper.style.zoom, "");
});

test("Panel targets its host even without an inner wrapper", (t) => {
  const { target, wrapper, sectionsRoot, win, controller } = fixture(t, "?zoom=.85", "panel");
  wrapper.remove();
  const card = win.document.createElement("hui-card");
  sectionsRoot.append(card);
  controller.refresh();
  assert.equal(target.style.zoom, "0.85");
  assert.equal(isWithin(card, target), true);
  assert.equal(card.style.zoom, "");
});

test("switching Sections to Masonry to Panel restores each detached target", (t) => {
  const { root, target, appendShadow, controller, win } = fixture(t, "?zoom=.85&marginTop=-15");
  let previous = target;
  for (const layout of ["masonry", "panel"]) {
    root.replaceChildren();
    const shadow = appendShadow(root, `hui-${layout}-view`);
    shadow.append(win.document.createElement("hui-card"));
    controller.refresh();
    assert.equal(previous.style.zoom, "");
    assert.equal(shadow.host.style.zoom, "0.85");
    assert.equal(win.document.body.style.marginTop, "-15px");
    previous = shadow.host;
  }
});

test("unknown custom layouts do not select nested supported-looking previews", (t) => {
  const { root, appendShadow, controller, win } = fixture(t);
  root.replaceChildren();
  const view = win.document.createElement("hui-view");
  root.append(view);
  const custom = win.document.createElement("custom-layout-view");
  view.append(custom);
  const nested = appendShadow(custom, "hui-masonry-view");
  controller.refresh();
  assert.equal(findZoomTarget(root), null);
  assert.equal(nested.host.style.zoom, "");
  assert.equal(win.document.body.style.marginTop, "");
});

test("a supported layout waits for its shadow root to be attached", (t) => {
  const { root, controller, win } = fixture(t);
  const layout = win.document.createElement("hui-masonry-view");
  root.replaceChildren(layout);
  controller.refresh();
  assert.equal(layout.style.zoom, "");
  layout.attachShadow({ mode: "open" });
  controller.refresh();
  assert.equal(layout.style.zoom, "0.85");
});

test("finds already-connected fixed layers across shadow boundaries", (t) => {
  const { wrapper, appendShadow, win, controller } = fixture(t);
  const card = appendShadow(wrapper, "example-card");
  const layer = win.document.createElement("div");
  layer.setAttribute("data-ha-scale-fixed", "");
  card.append(layer);
  controller.refresh();
  assert.equal(Number(layer.style.zoom), 1 / .85);
  assert.equal(isWithin(layer, wrapper), true);
});

test("supports legacy layer events and ignores layers outside the wrapper", (t) => {
  const { win, wrapper, controller, navigate } = fixture(t);
  const layer = win.document.createElement("div");
  const outside = win.document.createElement("div");
  wrapper.append(layer);
  win.document.body.append(outside);
  for (const element of [layer, outside]) {
    win.dispatchEvent(new win.CustomEvent("ha-scale-fixed-layer-connected", { detail: { element } }));
  }
  controller.refresh();
  assert.equal(Number(layer.style.zoom), 1 / .85);
  assert.equal(outside.style.zoom, "");
  navigate("");
  assert.equal(layer.style.zoom, "");
});

test("nested fixed layers are compensated only once", (t) => {
  const { win, wrapper, controller } = fixture(t);
  const outer = win.document.createElement("div");
  const inner = win.document.createElement("div");
  for (const element of [outer, inner]) element.setAttribute("data-ha-scale-fixed", "");
  outer.append(inner);
  wrapper.append(outer);
  controller.refresh();
  assert.equal(Number(outer.style.zoom), 1 / .85);
  assert.equal(inner.style.zoom, "");
});

test("disconnected layer restores its own previous zoom", (t) => {
  const { win, wrapper, controller } = fixture(t);
  const layer = win.document.createElement("div");
  layer.style.zoom = "1.2";
  wrapper.append(layer);
  win.dispatchEvent(new win.CustomEvent("ha-scale-fixed-layer-connected", { detail: { element: layer } }));
  controller.refresh();
  layer.remove();
  win.dispatchEvent(new win.CustomEvent("ha-scale-fixed-layer-disconnected", { detail: { element: layer } }));
  assert.equal(layer.style.zoom, "1.2");
});

test("invalid layer event payloads are harmless", (t) => {
  const { win, controller } = fixture(t);
  for (const element of [null, {}, "text"]) {
    for (const type of ["connected", "disconnected"]) {
      win.dispatchEvent(new win.CustomEvent(`ha-scale-fixed-layer-${type}`, { detail: { element } }));
    }
  }
  assert.doesNotThrow(() => controller.refresh());
});

test("observes delayed content inside a shadow root", async (t) => {
  const { win, sectionsRoot, wrapper, controller } = fixture(t);
  wrapper.remove();
  controller.refresh();
  sectionsRoot.append(wrapper);
  await new Promise((resolve) => win.setTimeout(resolve, 60));
  assert.equal(wrapper.style.zoom, "0.85");
});

test("location-changed triggers a refresh without manual intervention", async (t) => {
  const { win, wrapper } = fixture(t);
  win.history.pushState({}, "", "?zoom=1.5");
  win.dispatchEvent(new win.Event("location-changed"));
  await new Promise((resolve) => win.setTimeout(resolve, 60));
  assert.equal(wrapper.style.zoom, "1.5");
});

test("disconnect cancels future changes and restores styles", (t) => {
  const { controller, wrapper, win } = fixture(t);
  controller.disconnect();
  assert.equal(wrapper.style.zoom, "");
  assert.equal(win.document.body.style.marginTop, "");
  controller.refresh();
  assert.equal(wrapper.style.zoom, "");
});

test("startup tolerates a missing HA tree", async (t) => {
  const win = new Window({ url: "https://ha.example.test/?zoom=.85" });
  const controller = startDashboardFit(win);
  t.after(async () => { controller.disconnect(); await win.happyDOM.close(); });
  assert.equal(win.document.body.style.zoom, "");
  assert.equal(win.document.body.style.marginTop, "");
});

test("HACS and package metadata agree", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const hacs = JSON.parse(await readFile(new URL("../hacs.json", import.meta.url), "utf8"));
  assert.equal(hacs.filename, `${pkg.name}.js`);
  assert.equal(pkg.license, "MIT");
  assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
});
