warning: in the working copy of 'js/header.js', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/js/header.js b/js/header.js[m
[1mindex 43066fb..096bbc5 100644[m
[1m--- a/js/header.js[m
[1m+++ b/js/header.js[m
[36m@@ -1,39 +1,35 @@[m
[31m-/**[m
[31m- * header.js — 共用頂部導覽列元件[m
[31m- *[m
[31m- * 職責邊界:只負責「畫導覽列 + 顯示整體同步狀態」,渲染進呼叫端頁面已存在的[m
[31m- * <div id="app-header"></div> 容器(容器樣式已定義於style.css)。[m
[31m- * 不建立新的儲存邏輯,同步狀態一律讀Storage.hasUnsyncedChanges的既有結果。[m
[31m- *[m
[31m- * 用法(需先載入 storage.js,再載入本檔):[m
[32m+[m[32m﻿/**[m
[32m+[m[32m * header.js ???梁?撠汗??隞? *[m
[32m+[m[32m * ?瑁痊??:?芾?鞎研撠汗??+ 憿舐內?湧??郊???皜脫??脣?怎垢?撌脣??函?[m
[32m+[m[32m * <div id="app-header"></div> 摰孵(摰孵璅??撌脣?蝢拇style.css)?? * 銝遣蝡?摮?頛??郊???敺?Storage.hasUnsyncedChanges????? *[m
[32m+[m[32m * ?冽?(?????storage.js,???交瑼?:[m
  *   <div id="app-header"></div>[m
  *   <script src="../js/storage.js"></script>[m
  *   <script src="../js/header.js"></script>[m
  *   <script>AppHeader.init({ activeKey: "grades", inModule: true });</script>[m
  *[m
[31m- *   activeKey: "home" | "courses" | "credits" | "timetable" | "grades"(對應目前所在頁面,不傳則不高亮任何連結)[m
[31m- *   inModule:  true = 目前頁面位於 modules/ 目錄下(連結需相對回上層或同層);false = 位於根目錄(如index.html)[m
[32m+[m[32m *   activeKey: "home" | "courses" | "credits" | "timetable" | "grades"(撠??桀???券???銝??擃漁隞颱????)[m
[32m+[m[32m *   inModule:  true = ?桀??雿 modules/ ?桅?銝??????詨???撅斗??惜);false = 雿?寧??憒ndex.html)[m
  */[m
 (function (global) {[m
   "use strict";[m
 [m
   const NAV_ITEMS = [[m
[31m-    { key: "home", label: "首頁", fromRoot: "index.html", fromModule: "../index.html" },[m
[31m-    { key: "courses", label: "課程資料庫", fromRoot: "modules/courses.html", fromModule: "courses.html" },[m
[31m-    { key: "credits", label: "學分・勞作中心", fromRoot: "modules/credits.html", fromModule: "credits.html" },[m
[31m-    { key: "timetable", label: "課表產生器", fromRoot: "modules/timetable.html", fromModule: "timetable.html" },[m
[31m-    { key: "grades", label: "成績試算", fromRoot: "modules/grades.html", fromModule: "grades.html" },[m
[32m+[m[32m    { key: "home", label: "擐?", fromRoot: "index.html", fromModule: "../index.html" },[m
[32m+[m[32m    { key: "courses", label: "隤脩?鞈?摨?, fromRoot: "modules/courses.html", fromModule: "courses.html" },[m
[32m+[m[32m    { key: "credits", label: "摮詨??餃?雿葉敹?, fromRoot: "modules/credits.html", fromModule: "credits.html" },[m
[32m+[m[32m    { key: "timetable", label: "隤脰”?Ｙ???, fromRoot: "modules/timetable.html", fromModule: "timetable.html" },[m
[32m+[m[32m    { key: "grades", label: "?蜀閰衣?", fromRoot: "modules/grades.html", fromModule: "grades.html" },[m
   ];[m
 [m
[31m-  // 目前會影響「整體同步狀態」燈號的資料key(見storage.js的PREFIX命名空間)[m
[31m-  const TRACKED_KEYS = ["catalog", "my-courses", "curriculum"];[m
[32m+[m[32m  // ?桀??蔣?踴擃?甇亦?????鞈?key(閬torage.js?REFIX?賢?蝛粹?)[m
 [m
   function anyUnsynced() {[m
     return TRACKED_KEYS.some((key) => {[m
       try {[m
         return global.Storage && global.Storage.hasUnsyncedChanges(key);[m
       } catch (err) {[m
[31m-        return false; // Storage尚未載入或該key出錯時,不讓整個導覽列崩潰[m
[32m+[m[32m        return false; // Storage撠頛?府key?粹??銝??游?閬賢?撏拇蔑[m
       }[m
     });[m
   }[m
[36m@@ -58,7 +54,7 @@[m
     const container = document.getElementById("app-header");[m
     if (!container) return;[m
 [m
[31m-    const brand = el("span", { class: "app-header-brand", text: "學分登記簿" });[m
[32m+[m[32m    const brand = el("span", { class: "app-header-brand", text: "摮詨??餉?蝪? });[m
 [m
     const nav = el([m
       "nav",[m
[36m@@ -74,7 +70,7 @@[m
 [m
     const unsynced = anyUnsynced();[m
     const dot = el("span", { class: "sync-dot " + (unsynced ? "yellow" : "green") });[m
[31m-    const label = el("span", { text: unsynced ? "有未同步變更" : "本機資料已記錄" });[m
[32m+[m[32m    const label = el("span", { text: unsynced ? "??郊霈" : "?祆?鞈?撌脰??? });[m
     const syncStatus = el("div", { class: "sync-status" }, [dot, label]);[m
 [m
     container.innerHTML = "";[m
[36m@@ -84,3 +80,4 @@[m
 [m
   global.AppHeader = { init };[m
 })(window);[m
[41m+[m
