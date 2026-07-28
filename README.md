# course-tools

學分 / 選課管理工具 — 公開前端

## 架構說明

純靜態網頁，GitHub Pages 部署。無 server、無 build pipeline、無 CI/CD。

## Repo 分工

| Repo | 可見度 | 內容 |
|---|---|---|
| `course-tools` | 公開 | 前端程式碼 + 非個資資料（課程目錄、老師清單） |
| `course-data-private` | **私密** | 個人資料（選課紀錄、成績、評價、獎助） |

## 資料分流原則

「這份資料若被任何人看到，你是否介意？」  
→ 不介意：公開 repo。介意：私密 repo。

## 六大模組

- `courses.html` — 課程資料庫
- `timetable.html` — 課表產生器
- `credits.html` — 學分 / 勞作中心
- `reviews.html` — 老師評價
- `grades.html` — 加權成績試算
- `scholarships.html` — 獎助 / 實習追蹤

## Token 設定

詳見 `modules/settings.html`（Phase 06 實作）。

## 實作進度

- Phase 01：雙倉庫初始化 + storage.js + editable-table.js
- Phase 02：courses.html 模組 + list-editor.js
- Phase 03：credits.html + timetable.html 模組 + credit-calc.js
- Phase 06（骨架標籤原指 Phase 05，見 Meta_Dev_Knowledge.md PAT-05）：reviews.html + scholarships.html 模組、header.js 導覽列
- Phase 07：thu-api.js + courses.html 東海課程資訊網匯入面板
- Phase 08（當前）：grades.html + grade-calc.js 加權成績試算，移植自 course-tools-merged-mvp（改用本 repo 的 Storage/EditableTable 慣例重新實作，非直接複製）
