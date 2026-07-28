# PAT 索引

> 詳細內容見 `../Meta_Dev_Knowledge.md`。本檔僅作快速查找用途。

| 編號 | 標題 | 等級 | 狀態 |
|---|---|---|---|
| PAT-01 | 資料分流原則 | CORE_IMMUTABLE | 生效中 |
| PAT-02 | 共用元件職責邊界 | CORE_IMMUTABLE | 生效中，Phase 02 已驗證 |
| PAT-03 | enum 唯一來源 | CORE_IMMUTABLE | 生效中，雲端來源待 Phase 06 接上 |
| PAT-04 | 測試環境限制 — 原生 prompt() 對話框 | KNOWN_ISSUE | 因應模式已定案，後續 Phase 沿用 |
| PAT-05 | Phase 編號與骨架標籤不一致 | KNOWN_ISSUE | 已存證，使用者選擇維持 Phase 06 編號 |
| PAT-06 | Phase 03 遺留測試失敗（creditTypeSubtotal） | RESOLVED | 2026-07-28：程式碼行為裁定正確，已修正測試斷言 |
| PAT-07 | 指令書引用不存在的 API／欄位（連續2輪） | KNOWN_ISSUE | 執行前核對實檔已成慣例 |
| PAT-08 | editable-table.js 無 filterFn、新增/刪除鈕無法關閉 | KNOWN_LIMITATION | 2026-07-29：grades.html 移植時發現，改手刻表格繞開 |
