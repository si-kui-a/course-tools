const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
let passCount = 0;
let failCount = 0;

function check(label, condition, detail) {
  if (condition) {
    console.log("  [PASS] " + label);
    passCount++;
  } else {
    console.log("  [FAIL] " + label + (detail ? " -> " + detail : ""));
    failCount++;
  }
}

function freshWindow() {
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    url: "http://localhost/",
    runScripts: "dangerously",
  });
  return dom.window;
}

function loadScriptInto(win, relPath) {
  const src = fs.readFileSync(path.join(ROOT, relPath), "utf8");
  const scriptEl = win.document.createElement("script");
  scriptEl.textContent = src;
  win.document.body.appendChild(scriptEl);
}

// ---------- 測試1：importData 型別是否保留 ----------
console.log("\n[測試1] Storage.importData 型別保留 (修正1)");
{
  const win = freshWindow();
  loadScriptInto(win, "js/storage.js");
  const envelopeJson = JSON.stringify({ _type: "typeA", savedAt: "x", payload: { a: 2 } });
  win.Storage.importData("t1", envelopeJson); // 故意不傳 expectedType,模擬型別遺失情境
  const loaded = win.Storage.load("t1", "typeA");
  check(
    "匯入後用原本的 _type 讀回不應報 type_mismatch",
    loaded && !loaded.error,
    loaded && loaded.error ? "回傳錯誤: " + loaded.error : ""
  );
  check("payload 內容正確", loaded && loaded.payload && loaded.payload.a === 2);
}

// ---------- 測試2：損毀資料是否被判定為未同步 ----------
console.log("\n[測試2] 損毀資料應顯示未同步 (修正2)");
{
  const win = freshWindow();
  loadScriptInto(win, "js/storage.js");
  win.localStorage.setItem("ctool_data_t2", "這不是合法JSON{{{");
  const unsynced = win.Storage.hasUnsyncedChanges("t2");
  check("損毀資料 hasUnsyncedChanges 應回傳 true", unsynced === true, "實際回傳: " + unsynced);
}

// ---------- 測試3：退選課程不應計入修習學分 ----------
console.log("\n[測試3] 退選課程排除於修習學分外 (修正3)");
{
  const win = freshWindow();
  loadScriptInto(win, "js/credit-calc.js");
  const myCourses = [
    { semester: "大二上", status: "selected", resultStatus: "withdrawn", credits: 3 },
    { semester: "大二上", status: "selected", resultStatus: "passed", credits: 2 },
  ];
  const result = win.CreditCalc.computeTaken(myCourses, "大二上", {});
  check("退選3學分不應被算入,應只剩2學分", result.value === 2, "實際回傳: " + result.value);
}

// ---------- 測試4：清空資料不應被誤判為首次使用 ----------
console.log("\n[測試4] 清空的 my-courses 不應被 fallback 覆寫 (修正4)");
{
  const win = freshWindow();
  loadScriptInto(win, "js/storage.js");

  const indexHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const match = indexHtml.match(/function loadMyCourses\(\) \{[\s\S]*?\n  \}/);
  check("能從 index.html 抓到 loadMyCourses 函式原始碼", !!match);

  if (match) {
    win.MYCOURSES_KEY = "my-courses";
    win.MYCOURSES_TYPE = "my-courses";
    win.FALLBACK_MYCOURSES = [{ instanceId: "demo1", name: "示範課程" }];

    // 模擬使用者已經把課程全部刪光,存成空陣列
    win.Storage.save("my-courses", [], "my-courses");

    const fnSrc = "(function(){ const Storage = window.Storage; const MYCOURSES_KEY = window.MYCOURSES_KEY; const MYCOURSES_TYPE = window.MYCOURSES_TYPE; const FALLBACK_MYCOURSES = window.FALLBACK_MYCOURSES; return " + match[0] + "; })()";
    const loadMyCourses = win.eval(fnSrc);
    const result = loadMyCourses();

    check(
      "空陣列應該原樣回傳,不應變成 fallback 示範資料",
      Array.isArray(result) && result.length === 0,
      "實際回傳: " + JSON.stringify(result)
    );
  }
}

console.log("\n========================================");
console.log("通過: " + passCount + "  失敗: " + failCount);
console.log("========================================");
process.exit(failCount > 0 ? 1 : 0);
