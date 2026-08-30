"""
dev_knowledge_audit.py — 「資深懶散工程師複查」的機械化版本。

移植自wordpress-builder-playbook repo的repo-audit.js方法論（跨repo
方法論試點第5個）。本repo的PAT條目格式是`### PAT-NN：說明`（全形冒號，
無中括號——注意跟sig/ip repo的`## PAT-NN [TAG]:`格式不同，這裡的
偵測正規表達式是照這個repo實際格式寫的，不要跨repo複製這支腳本時
以為格式一樣）。

跟`scripts/ci_checks.py`（HTML本地引用完整性+JSON格式驗證）性質不同、
不重複：那支是CI硬gate，這支是找候選給人工/AI複查，不進CI。

只做「找候選」，不做「判斷對錯」。執行方式：
`python scripts/dev_knowledge_audit.py`（純stdlib）。
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[1]
EXCLUDE_DIRS = {".git", "node_modules", "__pycache__", ".pytest_cache"}


def walk_files(*suffixes: str) -> list[Path]:
    out = []
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        if any(part in EXCLUDE_DIRS for part in path.relative_to(ROOT).parts):
            continue
        if path.suffix in suffixes:
            out.append(path)
    return out


def rel(p: Path) -> str:
    return str(p.relative_to(ROOT)).replace("\\", "/")


PAT_RE = re.compile(r"^### PAT-(\d+)：", re.MULTILINE)


def parse_pat_numbers(text: str) -> list[int]:
    return [int(m) for m in PAT_RE.findall(text)]


def check_pat_continuity() -> set[int]:
    print("== 1. Meta_Dev_Knowledge.md PAT編號連續性 ==")
    kb = ROOT / "Meta_Dev_Knowledge.md"
    if not kb.is_file():
        print("  （找不到Meta_Dev_Knowledge.md，跳過）")
        return set()
    nums = parse_pat_numbers(kb.read_text(encoding="utf-8"))
    if not nums:
        print("  （沒有PAT條目，跳過）")
        return set()
    print(f"  找到{len(nums)}個PAT條目，編號範圍 {min(nums)}~{max(nums)}")
    present = set(nums)
    missing = [n for n in range(min(nums), max(nums) + 1) if n not in present]
    dup = sorted({n for n in nums if nums.count(n) > 1})
    if missing:
        print(f"  ⚠️ 跳號：{missing}")
    if dup:
        print(f"  ⚠️ 重複編號：{dup}")
    if not missing and not dup:
        print("  （連續無跳號無重複）")
    return present


def check_pat_cross_references(real_nums: set[int]) -> None:
    print("\n== 2. 其他檔案引用的PAT編號是否還存在 ==")
    if not real_nums:
        print("  （無PAT條目，跳過）")
        return
    ref_nums: set[int] = set()
    broken: list[str] = []
    for path in walk_files(".md", ".js", ".html"):
        if path.name == "Meta_Dev_Knowledge.md":
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for m in re.finditer(r"PAT-(\d+)", text):
            n = int(m.group(1))
            ref_nums.add(n)
            if n not in real_nums:
                broken.append(f"{rel(path)} 引用 PAT-{n:02d}")
    print(f"  其他檔案引用了{len(ref_nums)}個不重複的PAT編號")
    if broken:
        print("  ⚠️ 引用了Meta_Dev_Knowledge.md目前不存在的編號：")
        for b in broken:
            print(f"    {b}（可能已被改號/合併/刪除）")
    else:
        print("  （全部引用的編號都找得到，無需更新）")


def check_size_outliers() -> None:
    print("\n== 3. JS/CSS檔案篇幅（>400行標記，僅供參考）==")
    counts = []
    for path in walk_files(".js", ".css"):
        try:
            lines = len(path.read_text(encoding="utf-8").splitlines())
        except UnicodeDecodeError:
            continue
        counts.append((lines, rel(path)))
    counts.sort(reverse=True)
    for lines, name in counts[:8]:
        print(f"  {lines}\t{name}{' ⚠️' if lines > 400 else ''}")


def check_stale_keywords() -> None:
    print("\n== 4. 過時關鍵字候選（每個都要人工確認，不代表一定過時）==")
    markers = ["尚未", "還沒動工", "未確認", "待確認", "TODO", "FIXME"]
    hits = 0
    for path in walk_files(".md"):
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for idx, line in enumerate(text.splitlines(), 1):
            for marker in markers:
                if marker in line:
                    hits += 1
                    print(f"  {rel(path)}:{idx}  [{marker}]  {line.strip()[:70]}")
                    break
    if hits == 0:
        print("  （沒有命中）")
    print(f"  共{hits}處候選——逐一確認是否已被同檔案或其他檔案的較新內容取代")


def main() -> int:
    real_nums = check_pat_continuity()
    check_pat_cross_references(real_nums)
    check_size_outliers()
    check_stale_keywords()
    print("\n完成。以上都只是候選，不是結論——逐項人工/AI確認後才動手修。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
