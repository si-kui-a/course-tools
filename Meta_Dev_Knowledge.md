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

### PAT-06：Phase 03 遺留測試失敗（KNOWN_ISSUE）

**現象**：`test/phase03.html`「③ creditTypeSubtotal / breakdown」區塊有 2 項失敗
（「系選小計正確」「breakdown 系選=3」），在合併 phase-03 分支進 main 時即已存在，
與本次 Phase 06 的異動（未觸碰 `credit-calc.js`）無關，純屬發現順帶回報。

**因應**：本輪未修復，因修改 `credit-calc.js` 屬於受保護檔案、超出本次指令書範圍。
留待下一輪明確授權後處理。

## 待解事項

- Phase 03 `credit-calc.js` 的 `creditTypeSubtotal`／`creditTypeBreakdown` 對「系選」
  類別計算有誤（見 PAT-06），待下一輪授權修復。

## 版本歷史

| 版本 | 異動說明 |
|---|---|
| v0.1.0 | Phase 01：雙倉庫初始化 + storage.js + editable-table.js |
| v0.2.0 | Phase 02：courses.html 模組 + list-editor.js |
| v0.3.0 | Phase 03：credits.html + timetable.html 模組 + credit-calc.js |
| v0.4.0 | Phase 06（骨架標籤原指 Phase 05，見 PAT-05）：reviews.html + scholarships.html 模組、header.js 導覽列、data/teachers.json 與 data/catalog-config.json 調整、data/scholarships.json 新增 |
