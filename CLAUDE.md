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
