// 極簡錯誤提示 banner。用於「資料損毀」等需要使用者知情的情境。
// 純全域變數寫法(與storage.js/header.js一致,不用ES module)。

window.ErrorBanner = {
  show(message) {
    let el = document.getElementById("app-error-banner");
    if (!el) {
      el = document.createElement("div");
      el.id = "app-error-banner";
      el.style.cssText =
        "position:fixed;top:0;left:0;right:0;z-index:9999;" +
        "background:#b91c1c;color:#fff;padding:8px 16px;" +
        "font-size:14px;text-align:center;";
      document.body.prepend(el);
    }
    el.textContent = message;
    el.style.display = "block";
  },
  hide() {
    const el = document.getElementById("app-error-banner");
    if (el) el.style.display = "none";
  },
};