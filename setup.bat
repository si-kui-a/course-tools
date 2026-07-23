@echo off
chcp 65001 > nul
setlocal EnableDelayedExpansion

:: ================================================================
::  學分管理工具 — Phase 01 初始化腳本
::  前提：
::    1. 已在 GitHub.com 建立兩個空 repo（不勾選 Initialize README）
::       - course-tools（Public）
::       - course-data-private（Private）
::    2. 已將 course-tools\ 與 course-data-private\ 解壓縮至同一目錄
::    3. 本 .bat 與兩個資料夾在同一目錄下
:: ================================================================

:: ---- 修改這兩個變數後再執行 ------------------------------------
set GH_USER=你的GitHub帳號
set LOCAL_ROOT=%~dp0
:: ---------------------------------------------------------------

:: 驗證 GH_USER 已填入
if "%GH_USER%"=="你的GitHub帳號" (
    echo.
    echo [錯誤] 請先用記事本開啟 setup.bat，把 GH_USER 改成你的 GitHub 帳號名稱。
    echo.
    pause
    exit /b 1
)

:: 驗證 git 已安裝
git --version > nul 2>&1
if errorlevel 1 (
    echo [錯誤] 找不到 git，請先安裝 Git for Windows。
    pause
    exit /b 1
)

echo.
echo ================================================================
echo  學分管理工具 Phase 01 初始化
echo  GitHub user : %GH_USER%
echo  工作目錄    : %LOCAL_ROOT%
echo ================================================================
echo.
echo 確認兩個空 repo 已在 GitHub.com 建立後，按任意鍵繼續...
pause > nul

:: ================================================================
::  REPO 1：course-tools（公開）
:: ================================================================
echo.
echo [1/2] 初始化 course-tools...
echo ----------------------------------------------------------------

cd /d "%LOCAL_ROOT%course-tools"
if errorlevel 1 (
    echo [錯誤] 找不到 course-tools\ 資料夾，確認解壓縮位置與 setup.bat 在同一層。
    pause
    exit /b 1
)

git init
git config core.quotepath false
git checkout -b phase-01-foundation

:: Commit 1：骨架結構
git add .gitignore README.md Meta_Dev_Knowledge.md index.html style.css
git add data\catalog.json data\teachers.json data\catalog-config.json
git add js\list-editor.js js\credit-calc.js js\github-sync.js js\header.js
git add modules\courses.html modules\timetable.html modules\credits.html
git add modules\reviews.html modules\grades.html modules\scholarships.html
git add modules\settings.html
git commit -m "chore: init course-tools skeleton structure"

:: Commit 2：storage.js
git add js\storage.js
git commit -m "feat: implement storage.js"

:: Commit 3：editable-table.js
git add js\editable-table.js
git commit -m "feat: implement editable-table.js"

:: Commit 4：測試頁
git add test\phase01.html
git commit -m "test: add phase01 acceptance test page"

:: Push
git remote add origin https://github.com/%GH_USER%/course-tools.git
echo.
echo [course-tools] 推送 phase-01-foundation 分支...
git push -u origin phase-01-foundation
if errorlevel 1 (
    echo.
    echo [錯誤] push 失敗。常見原因：
    echo   - Repo 名稱拼錯（確認 GitHub 上為 course-tools）
    echo   - 未登入 git credential（輸入 GitHub 帳號/密碼 或 PAT）
    echo   - Repo 已有內容（應為空 repo）
    pause
    exit /b 1
)

echo.
echo ✅ course-tools 初始化完成。
echo.

:: ================================================================
::  REPO 2：course-data-private（私密）
:: ================================================================
echo [2/2] 初始化 course-data-private...
echo ----------------------------------------------------------------

cd /d "%LOCAL_ROOT%course-data-private"
if errorlevel 1 (
    echo [錯誤] 找不到 course-data-private\ 資料夾。
    pause
    exit /b 1
)

git init
git config core.quotepath false
git checkout -b phase-01-init

:: Commit 1：骨架結構（全部一次）
git add .gitignore README.md
git add data\my-courses.json data\curriculum.json
git add data\reviews.json data\scholarships.json
git commit -m "chore: init course-data-private skeleton"

:: Push
git remote add origin https://github.com/%GH_USER%/course-data-private.git
echo.
echo [course-data-private] 推送 phase-01-init 分支...
git push -u origin phase-01-init
if errorlevel 1 (
    echo.
    echo [錯誤] push 失敗。確認 course-data-private 在 GitHub 上為 Private 空 repo。
    pause
    exit /b 1
)

echo.
echo ✅ course-data-private 初始化完成。

:: ================================================================
::  完成
:: ================================================================
echo.
echo ================================================================
echo  Phase 01 初始化全部完成！
echo.
echo  下一步驗收：
echo    1. 在 course-tools\ 執行：python -m http.server 8080
echo    2. 瀏覽器開啟：http://localhost:8080/test/phase01.html
echo    3. 確認頁面顯示「全部通過」
echo.
echo  GitHub 確認：
echo    https://github.com/%GH_USER%/course-tools/tree/phase-01-foundation
echo    https://github.com/%GH_USER%/course-data-private/tree/phase-01-init
echo ================================================================
echo.
pause
