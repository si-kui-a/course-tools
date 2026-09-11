# Meta_Dev_Knowledge.md — 學分管理工具

> 記錄架構決策、技術事故、不可變原則。
> 更新原則：只在發生具體技術事故或流程洞察時更新，不強行湊內容。

## 查證順序（2026-08-30訂定，移植自wordpress-builder-playbook repo的
同類規則）
不確定的做法先查這份檔案有沒有現成PAT條目，內部真的沒有才查外部；
查證後證實真實可用有益處的做法，直接補一則新PAT條目，不用另外問要
不要記錄。**機械複查**：`python scripts/dev_knowledge_audit.py`——PAT
編號連續性/跨檔案PAT引用完整性/JS·CSS檔案篇幅離群值/過時關鍵字候選，
純stdlib，只找候選不判斷對錯，不進CI（跟`scripts/ci_checks.py`的
HTML引用完整性/JSON格式驗證性質不同，那是CI硬gate，這支手動觸發）。

**★2026-08-30訂為閥值自動觸發★收工時先跑這行判斷要不要做健檢，不用
自己記或等使用者提醒**：
```bash
git rev-list --count $(head -c 7 scripts/.last-audit-marker)..HEAD
```
（**這個檔案不存在**時上面這行會直接報錯——代表從沒跑過健檢，視同
數字已達閥值，直接跑健檢腳本並用結果建立這個檔案，不用回頭修這行
指令）**這個數字≥8就自動跑**`python scripts/dev_knowledge_audit.py`，
跑完後用當下HEAD的short SHA+日期覆寫`scripts/.last-audit-marker`。

**全面收斂稽核（多輪修改收工前，或使用者要求「嚴格審核」時執行，
2026-08-30訂定，移植自wordpress-builder-playbook repo Phase 4.5的
同類概念，通用程式碼repo版）**：跟上面的機械複查是不同顆粒度、不同
觸發時機的兩件事——機械複查抓的是「距離上次健檢累積了幾個commit」
這種跨時間的知識庫落後；這裡抓的是「同一個功能/檔案範圍累積了多輪
反覆修改」造成的跨輪次內部不一致，零星單點驗證會漏掉這種「這一輪改
完當下沒問題，但跟三輪前改的地方兜不起來」的落差。

觸發時機：①同一功能/同一批檔案累積修改超過~10輪以上準備收工前，
②使用者明確要求「嚴格審核」/「全面檢查」時，③或懷疑有跨輪次殘留
不一致但說不出具體是什麼時。

查什麼：(1)跨檔案命名/欄位一致性——同一概念在本輪異動涉及的不同
檔案有沒有被叫成不同名字；(2)死碼/孤兒函式——早期輪次寫的邏輯被
同一輪內更晚版本取代但沒刪掉；(3)文件/註解與目前程式碼行為脫節；
(4)重複邏輯可收斂成共用函式卻沒有抽。跑完直接修掉抓到的問題，不用
等使用者再次提出——這是「收斂」動作的一部分，不是額外加碼。

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

### PAT-09：credit-calc.js `taken()` 是否應排除 `resultStatus='withdrawn'` 的課程（KNOWN_ISSUE，2026-09-11全倉庫稽核發現）

**現象**：`taken(myCourses, semester, manualFallback)` 在 `selected.length > 0`
時，對「該學期全部 `status='selected'` 的課程」直接加總學分——不篩
`resultStatus`，包含 `resultStatus='withdrawn'`（已退選）的課程。相對地，
`earned()` 明確只計入 `resultStatus='passed'`，`grade-calc.js` 的
`eligibleRows()` 也明確排除 `withdrawn`。三者對「withdrawn 課程該不該被
計入某個統計數字」的處置不一致，但只有 `taken()` 這處把 withdrawn 也
算進去。

**未能判定的原因**：這不是純程式邏輯問題，是東海大學「修習學分」這個
統計數字本身的規則——退選課程是否計入「修習學分」屬於校方學籍規則，
本專案沒有查證過真實規則，不能靠程式碼推論猜測哪一種是對的（零虛構
原則：不確定的業務規則不能自己拍板）。

**規則**：先向使用者/東海學籍規則查證「修習學分是否含已退選課程」，
確認後才修正 `taken()`（若答案是「不含」，改成 `selected.filter(c =>
c.resultStatus !== 'withdrawn')` 再加總，比照 `earned()`/`eligibleRows()`
的排除方式）。查證前不要自行選一種假設直接改。

## 待解事項

- PAT-09：`credit-calc.js` `taken()` 是否該排除 withdrawn 課程，待向使用者
  查證東海學籍規則。

## 版本歷史

| 版本 | 異動說明 |
|---|---|
| v0.1.0 | Phase 01：雙倉庫初始化 + storage.js + editable-table.js |
| v0.2.0 | Phase 02：courses.html 模組 + list-editor.js |
| v0.3.0 | Phase 03：credits.html + timetable.html 模組 + credit-calc.js |
| v0.4.0 | Phase 06（骨架標籤原指 Phase 05，見 PAT-05）：reviews.html + scholarships.html 模組、header.js 導覽列、data/teachers.json 與 data/catalog-config.json 調整、data/scholarships.json 新增 |
| v0.5.0 | Phase 07：thu-api.js + courses.html 東海課程匯入面板（三步驟、衝堂偵測） |
