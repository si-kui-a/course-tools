# course-tools — Project Context
# 安裝位置: C:\Projects\10-401_Course_Tools_東海學分選課工具\CLAUDE.md

## Stack
Pure static HTML/CSS/JS — zero build pipeline, zero npm, zero frameworks
Working dir: C:\Projects\files\

## Completed
Phase 01–03: storage.js (FNV-1a hashing), editable-table.js, list-editor.js,
courses.html, credit-calc.js, timetable.html (conflict detection),
credits.html (8-semester summary, GE domain, labor hours)

## Hard Constraint
No npm install. No build step. No external CDN unless already in existing files.
All JS must run directly in browser without transpilation.

## File Discovery
Always Read the target HTML file before modifying — inline scripts vary per page.

## Git 結構備註（2026-08-31查明）
外層repo本身（這個資料夾）跟`course-tools/`子模組共用同一個GitHub remote
`si-kui-a/course-tools.git`，但接的是完全不相干的兩條歷史：外層走
`master`（僅3個commit，2026-08-09自動化治理誤判此資料夾為全新專案時
建立的空殼，`git rev-list --max-parents=0 --all`可查到2個獨立root
commit）；子模組`course-tools/`走`main`（57個commit，2026-07-23起的
真實應用程式）。兩者互不干擾，**不要嘗試合併這兩條歷史**（無共同祖先，
`--allow-unrelated-histories`硬接只會產生語意不清的merge commit，換不
到實質好處）。外層repo的commit/PR只要處理`.gitmodules`、
`PROJECT_PROFILE.yaml`這類wrapper層級中繼資料即可，不需要也不應該跟
`main`對齊。`.gitmodules`已於2026-08-31補齊（先前遺漏，導致新clone
這個outer repo時子模組無法正確初始化），之後正常`git submodule update
--init`即可。

**2026-09-25更新：外層改走遠端`wrapper`分支**。外層歷史在GitHub上被刪過兩次
——2026-08-30刪`master`、2026-09-20刪`fix/profile-format-20260809`，後者依據是
「對應PR#6已關閉未合併、跟main無共同祖先＝死分支」，但該分支在PR關閉**之後**
還有8/31的`.gitmodules`修正與本段說明，導致外層歷史只剩本機一份。已推回
`origin/wrapper`並改追蹤它（hook禁止推`master`，故不沿用舊名）。**分支稽核／
清理時不要刪`wrapper`**：它跟`main`沒有共同祖先是刻意的，不是孤兒分支。
