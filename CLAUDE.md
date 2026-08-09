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
