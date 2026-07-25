/**
 * header.js — 共用頂部導覽列元件
 *
 * 職責邊界:只負責「畫導覽列 + 顯示整體同步狀態」,渲染進呼叫端頁面已存在的
 * <div id="app-header"></div> 容器(容器樣式已定義於style.css)。
 * 不建立新的儲存邏輯,同步狀態一律讀Storage.hasUnsyncedChanges的既有結果。
 *
 * 用法(需先載入 storage.js,再載入本檔):
 *   <div id="app-header"></div>
 *   <script src="../js/storage.js"></script>
 *   <script src="../js/header.js"></script>
 *   <script>AppHeader.init({ activeKey: "grades", inModule: true });</script>
 *
 *   activeKey: "home" | "courses" | "credits" | "timetable" | "grades"(對應目前所在頁面,不傳則不高亮任何連結)
 *   inModule:  true = 目前頁面位於 modules/ 目錄下(連結需相對回上層或同層);false = 位於根目錄(如index.html)
 */
(function (global) {
  "use strict";

  const NAV_ITEMS = [
    { key: "home", label: "首頁", fromRoot: "index.html", fromModule: "../index.html" },
    { key: "courses", label: "課程資料庫", fromRoot: "modules/courses.html", fromModule: "courses.html" },
    { key: "credits", label: "學分・勞作中心", fromRoot: "modules/credits.html", fromModule: "credits.html" },
    { key: "timetable", label: "課表產生器", fromRoot: "modules/timetable.html", fromModule: "timetable.html" },
    { key: "grades", label: "成績試算", fromRoot: "modules/grades.html", fromModule: "grades.html" },
  ];

  // 目前會影響「整體同步狀態」燈號的資料key(見storage.js的PREFIX命名空間)
  const TRACKED_KEYS = ["catalog", "my-courses", "curriculum"];

  function anyUnsynced() {
    return TRACKED_KEYS.some((key) => {
      try {
        return global.Storage && global.Storage.hasUnsyncedChanges(key);
      } catch (err) {
        return false; // Storage尚未載入或該key出錯時,不讓整個導覽列崩潰
      }
    });
  }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (k === "class") node.className = attrs[k];
        else if (k === "text") node.textContent = attrs[k];
        else node.setAttribute(k, attrs[k]);
      }
    }
    (children || []).forEach((c) => c && node.appendChild(c));
    return node;
  }

  function init(opts) {
    opts = opts || {};
    const activeKey = opts.activeKey || "";
    const inModule = !!opts.inModule;
    const container = document.getElementById("app-header");
    if (!container) return;

    const brand = el("span", { class: "app-header-brand", text: "學分登記簿" });

    const nav = el(
      "nav",
      { class: "app-header-nav" },
      NAV_ITEMS.map((item) => {
        const a = el("a", { text: item.label, href: inModule ? item.fromModule : item.fromRoot });
        if (item.key === activeKey) a.className = "active";
        return a;
      })
    );

    const left = el("div", { class: "app-header-left" }, [brand, nav]);

    const unsynced = anyUnsynced();
    const dot = el("span", { class: "sync-dot " + (unsynced ? "yellow" : "green") });
    const label = el("span", { text: unsynced ? "有未同步變更" : "本機資料已記錄" });
    const syncStatus = el("div", { class: "sync-status" }, [dot, label]);

    container.innerHTML = "";
    container.appendChild(left);
    container.appendChild(syncStatus);
  }

  global.AppHeader = { init };
})(window);
