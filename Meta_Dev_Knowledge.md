# Meta_Dev_Knowledge.md — 學分管理工具

> 記錄架構決策、技術事故、不可變原則。
> 更新原則：只在發生具體技術事故或流程洞察時更新，不強行湊內容。

---

## PAT 記錄

### PAT-01：資料分流原則（CORE_IMMUTABLE）

**決策**：判斷資料放公開/私密 repo 的標準：「若任何人看到，是否介意？」
**落實**：不介意 → `course-tools/data/`；介意 → `course-data-private/data/`

---

### PAT-02：共用元件職責邊界（CORE_IMMUTABLE）

**決策**：
- `storage.js`：只管 localStorage，不碰 GitHub API
- `editable-table.js`：只管 UI 渲染與 localStorage，不知道 GitHub 存在
- `list-editor.js`：只管 enum 增刪驗證，不碰資料儲存邏輯本身
- `github-sync.js`：只管 localStorage ↔ 雲端，不做 UI 表格渲染
- 模組頁（如 `courses.html`）為膠水層，串接以上元件，元件間不互相 import 內部實作

**Phase 02 驗證結果**：此邊界在 `courses.html` 實作中運作良好，`list-editor.js` 與
`editable-table.js` 完全獨立運作、互不知道對方存在，僅透過模組頁的 callback 串接。

---

### PAT-03：enum 唯一來源（CORE_IMMUTABLE）

**決策**：`creditType`、`resultStatus`、`semester` 的 enum 選項統一存於
`course-data-private/data/curriculum.json` 的 `enumOptions` 欄位。
`list-editor.js` 負責增刪，刪除前強制檢查使用中筆數，使用中則拒絕刪除。

**現況（Phase 02）**：GitHub 同步層（Phase 06）尚未實作，`curriculum.json` 的 enum
暫時以本地 fixture 值內嵌於 `courses.html`（`curriculumEnum` 變數），非真正私密 repo
讀取。此為刻意延後，非疏漏——待 Phase 06 `github-sync.js` 完成後接上真正來源。

---

### PAT-04：測試環境限制 — 原生 prompt() 對話框（KNOWN_ISSUE）

**現象**：瀏覽器自動化測試環境會自動關閉原生 `window.prompt()` 對話框（回傳 null），
無法用模擬點擊驅動依賴 `prompt()` 的互動流程做端對端截圖驗證。

**因應**：
1. 純資料轉換邏輯（如 `addToMyCourses` 的欄位映射與 enum 驗證）獨立抽出，
   以不依賴真實對話框的方式在自動化測試頁中覆蓋（見 `test/phase02.html` 測試③）
2. 端對端流程改用瀏覽器 console 暫時 stub `window.prompt`（僅供驗證，不修改原始碼）
   驅動完整點擊流程，人工確認資料正確寫入與畫面更新

**後續影響**：若之後模組（課表產生器、學分中心等）也用 `prompt()` 做簡易輸入，
沿用此驗證模式；長期若 `prompt()` 造成的驗證摩擦持續增加，可考慮改用自訂表單彈窗
（如擴充 `list-editor.js` 的 modal 樣式）取代原生 `prompt()`，但這是效率優化，非本輪
待辦。

---

### PAT-05：Phase 編號與骨架標籤不一致（KNOWN_ISSUE）

**現象**：本次收到的「Phase 06」指令書內容為 reviews.html + scholarships.html，但專案骨架
自建立起即有三處獨立標籤指向不同編號：`modules/grades.html` 標註「Phase 04 實作」、
`modules/reviews.html`／`modules/scholarships.html` 標註「Phase 05 實作」、
`modules/settings.html` 標註「Phase 06 實作」；`README.md`「Token 設定」一節也寫
「詳見 modules/settings.html（Phase 06 實作）」；且 PAT-03 早已將「Phase 06」保留給
`github-sync.js` 完成、接上 `curriculum.json` 真實來源。四處證據一致指向：
reviews/scholarships 應為 Phase 05，settings.html/github-sync 才是 Phase 06。

**因應**：已於執行前將此落差回報使用者，使用者兩次明確選擇「仍維持指令書原定的
Phase 06 編號」，故本輪分支/commit/tag 皆以 Phase 06 命名，本記錄僅存證落差本身，
不代表往後 Phase 編號會自動跳號對齊骨架標籤。

**後續影響**：下一輪若要實作 `settings.html`／`github-sync.js`，需與使用者確認其
Phase 編號如何訂定（沿用「Phase 07」延續本次的編號慣性，或改標「Phase 06」使其
名實相符），避免同一數字重複用於兩個不同範圍的 Phase。

---

### PAT-06：Phase 03 遺留測試失敗（RESOLVED，2026-07-28）

**現象**：`test/phase03.html`「③ creditTypeSubtotal / breakdown」區塊有 2 項失敗
（「系選小計正確」「breakdown 系選=3」），在合併 phase-03 分支進 main 時即已存在。

**根因覆核**：問題不在 `credit-calc.js`，而在測試本身斷言的語意錯誤。
`creditTypeSubtotal`/`creditTypeBreakdown` 是課表產生器（`timetable.html`）用來
顯示「目前排課」小計的函式，只依 `status===selected` 篩選，不管 `resultStatus`
——當學期新選課程本來就預設 `pending`（見 `courses.html` 的 `addToMyCourses`），
若要求只算 `passed` 才計入，會讓當學期小計在成績出來前永遠顯示 0，不符合課表
產生器「一目了然目前排課狀態」的用途。與 `earned()`（畢業學分門檻比對用，
故意只算 `passed`）是刻意不同語意的兩個函式，不是同一套邏輯的兩種寫法。

**因應**：程式碼行為裁定為正確、不修改；已修正 `test/phase03.html` 的斷言與
註解以反映正確語意（系選小計 3→6）。

---

### PAT-07：指令書引用不存在的 API／欄位（KNOWN_ISSUE，已連續 2 輪出現）

**現象**：Phase 06 指令書寫「沿用 `Storage.save/load`」，實際 `storage.js` 只有
`Storage.read/write`；Phase 07 指令書寫 `instanceId: Storage.generateId()`，實際
`storage.js` 沒有 `generateId`（UUID 產生邏輯在各模組頁自行用
`crypto.randomUUID ? ... : Date.now().toString(36)` 處理），且指令書要求寫入
`score: ""` 欄位，但 `my-courses` 的 `EditableTable` schema 與既有
`addToMyCourses()` 邏輯只有 `grading: []`／`note: ''`，沒有 `score` 欄位。

**因應**：兩次都在動工前用實際檔案內容核對、採用專案既有慣例（既有 API／既有欄位）
取代指令書寫的不存在項目，並在該輪 commit message／回報中列出偏離點，不悄悄照抄。

**後續影響**：下一輪指令書若再引用 `storage.js`／`editable-table.js` 的具體方法名或
`my-courses`／其他既有資料結構的欄位名，執行前應先 `Read` 實際檔案核對一次，
不假設指令書描述與現況一致。

### PAT-08：editable-table.js 無 filterFn、新增/刪除鈕無法關閉（KNOWN_LIMITATION）

**現象**：Phase 08 移植 `grades.html`（加權成績試算）時，原本想用 `EditableTable.init()`
顯示「my-courses 篩選過的子集（僅本學期已選課程）」，但實際檢視 `editable-table.js`
原始碼後發現：(1) 沒有 `filterFn` 這個選項；(2) 新增/刪除按鈕永遠渲染、無法透過
options 關閉。若硬塞篩選後的子集進去，新增會產生沒有學期/課名的幽靈列（因為
`onChange` 只拿得到子集，用 instanceId 合併回完整 `myCourses` 時，新增的列不在
原子集裡、會被合併邏輯誤判為「已刪除」而丟掉；反過來刪除子集裡的列，合併邏輯
又會把它當「未變更」而保留，實際上刪不掉）。

**因應**：`grades.html` 改比照 `courses.html` 的 Catalog 唯讀表格作法，不用
`EditableTable`，直接手刻 `<table>`、對 `myCourses.filter(...)` 篩選出的列（陣列
參照本身，非深拷貝）掛 change 事件，改一個欄位就直接寫回原物件、`persistMyCourses()`
一次寫整份，不經過 `EditableTable` 的深拷貝＋新增/刪除機制。這頁本來就只需要「編輯
已選課程的分數/類別/結果」，課程本身的新增/刪除本來就該統一走 `courses.html`。

**後續影響**：未來若有其他模組想顯示 `my-courses`（或其他既有集合）的篩選子集且
需要編輯功能，比照本頁做法手刻表格，不要嘗試餵子集進 `EditableTable.init()`。
若真的需要「可篩選+可新增+可刪除」的完整功能，`editable-table.js` 本身要先加
`filterFn` 支援與「隱藏新增/刪除鈕」的 options，這是元件層級的擴充，不是單一頁面
可以繞過的事。

**附帶**：PAT-07 提到指令書曾要求 `my-courses` 寫入 `score` 欄位、但當時 schema
沒有——現在 `grades.html` 正式讓 `score` 成為 `my-courses` 記錄的合法欄位（只在此頁
讀寫，`courses.html` 的 EditableTable schema 不需要跟著加這個欄位，跟 `grading`/
`note` 這些「有些頁面用、有些頁面不用」的既有欄位待遇一致）。

## 待解事項

（目前無）

## 版本歷史

| 版本 | 異動說明 |
|---|---|
| v0.1.0 | Phase 01：雙倉庫初始化 + storage.js + editable-table.js |
| v0.2.0 | Phase 02：courses.html 模組 + list-editor.js |
| v0.3.0 | Phase 03：credits.html + timetable.html 模組 + credit-calc.js |
| v0.4.0 | Phase 06（骨架標籤原指 Phase 05，見 PAT-05）：reviews.html + scholarships.html 模組、header.js 導覽列、data/teachers.json 與 data/catalog-config.json 調整、data/scholarships.json 新增 |
| v0.5.0 | Phase 07：thu-api.js + courses.html 東海課程匯入面板（三步驟、衝堂偵測） |
