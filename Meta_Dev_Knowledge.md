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
- `github-sync.js`：只管 localStorage ↔ 雲端，不做 UI 表格渲染
- 兩者透過模組頁少量膠水程式碼串接，不互相 import 對方內部實作

---

### PAT-03：enum 唯一來源（CORE_IMMUTABLE）

**決策**：`creditType`、`resultStatus`、`semester` 的 enum 選項統一存於
`course-data-private/data/curriculum.json` 的 `enumOptions` 欄位。  
`list-editor.js` 負責增刪，刪除前強制檢查使用中筆數，使用中則拒絕刪除。

---

## 待解事項

（Phase 01 結束後視情況補充）

## 版本歷史

| 版本 | 異動說明 |
|---|---|
| v0.1.0 | Phase 01：雙倉庫初始化 + storage.js + editable-table.js |
