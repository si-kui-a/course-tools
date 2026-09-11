"""
ci_checks.py — CI-only smoke checks for this zero-build static site
(html/css/js + JSON data), stdlib only, no npm/node needed for this part.

1. Every local <script src>/<link href>/<img src> in every .html file must
   resolve to a real file -- with no build step, a typo'd relative path
   only shows up as a silent 404 in the browser console, never as an error
   anywhere else.
2. Every data/*.json file must be valid JSON -- these are hand-edited data
   files (course catalog, scholarships, teachers), not generated.
3. Several UI enum option lists (SEMESTERS, creditTypeOptions,
   categoryOptions/domainOptions) are hand-duplicated as literal arrays
   across multiple modules/*.html files with no shared-config loader and
   no sync mechanism -- confirmed 2026-09-11 audit: the 'curriculum-enum'
   localStorage key that courses.html/grades.html both *read* as a
   would-be shared source is never *written* anywhere, so the "shared"
   fallback is purely coincidental duplication. If one copy is edited and
   another isn't, nothing errors anywhere -- a course could silently
   become impossible to categorize correctly in one module while working
   fine in another. Catch that here instead of relying on someone noticing.

JS syntax itself is checked separately in the workflow via `node --check`
(Node ships on GitHub's runners; no reason to reimplement a JS parser here).
"""
import json
import os
import re
import sys
from html.parser import HTMLParser
from urllib.parse import urlsplit

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCAL_REF_ATTRS = {"script": "src", "link": "href", "img": "src"}


class RefCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []

    def handle_starttag(self, tag, attrs):
        attr_name = LOCAL_REF_ATTRS.get(tag)
        if not attr_name:
            return
        for name, value in attrs:
            if name == attr_name and value:
                self.refs.append(value)


def _is_local(ref):
    parsed = urlsplit(ref)
    # http(s)://, //cdn..., mailto:, data: etc. are not local files we can check
    return not parsed.scheme and not parsed.netloc


def check_html_refs():
    errors = []
    for dirpath, _dirnames, filenames in os.walk(ROOT):
        if os.sep + ".git" in dirpath + os.sep:
            continue
        for fname in filenames:
            if not fname.endswith(".html"):
                continue
            html_path = os.path.join(dirpath, fname)
            with open(html_path, "r", encoding="utf-8") as f:
                content = f.read()
            parser = RefCollector()
            parser.feed(content)
            for ref in parser.refs:
                if not _is_local(ref):
                    continue
                target = os.path.normpath(os.path.join(os.path.dirname(html_path), urlsplit(ref).path))
                if not os.path.isfile(target):
                    errors.append(f"{os.path.relpath(html_path, ROOT)}: broken local reference '{ref}'")
    return errors


def check_json_data():
    errors = []
    data_dir = os.path.join(ROOT, "data")
    if not os.path.isdir(data_dir):
        return errors
    for fname in sorted(os.listdir(data_dir)):
        if not fname.endswith(".json"):
            continue
        path = os.path.join(data_dir, fname)
        try:
            with open(path, "r", encoding="utf-8") as f:
                json.load(f)
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            errors.append(f"data/{fname}: invalid JSON ({e})")
    return errors


def _extract_js_array_literal(text, marker_pattern):
    """Find `marker_pattern` (must have one capture group around `[...]`)
    and parse the captured JS array literal as JSON. JS single-quoted
    string arrays parse fine as JSON after swapping quote style, since
    none of the values here contain an internal apostrophe."""
    m = re.search(marker_pattern, text)
    if not m:
        return None
    try:
        return json.loads(m.group(1).replace("'", '"'))
    except json.JSONDecodeError:
        return None


def check_duplicate_constants():
    errors = []

    # Groups of files that each hand-duplicate the same JS array literal.
    js_groups = [
        ("SEMESTERS", r"const SEMESTERS = (\[[^\]]*\]);", [
            "modules/credits.html", "modules/grades.html",
            "modules/timetable.html", "modules/reviews.html",
        ]),
        ("curriculumEnum.creditTypeOptions", r"creditTypeOptions:\s*(\[[^\]]*\])", [
            "modules/courses.html", "modules/grades.html",
        ]),
    ]
    for label, pattern, relpaths in js_groups:
        values = {}
        for relpath in relpaths:
            path = os.path.join(ROOT, relpath)
            if not os.path.isfile(path):
                continue
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            parsed = _extract_js_array_literal(content, pattern)
            if parsed is None:
                errors.append(f"{relpath}: expected to find '{label}' constant, pattern didn't match (check didn't go stale silently, please update ci_checks.py)")
                continue
            values[relpath] = parsed
        if not values:
            continue
        first_file, first_val = next(iter(values.items()))
        for relpath, val in values.items():
            if val != first_val:
                errors.append(f"{label} drifted: {relpath}={val!r} != {first_file}={first_val!r}")

    # courses.html's hardcoded localStorage-fallback vs data/catalog-config.json
    courses_path = os.path.join(ROOT, "modules", "courses.html")
    catalog_config_path = os.path.join(ROOT, "data", "catalog-config.json")
    if os.path.isfile(courses_path) and os.path.isfile(catalog_config_path):
        with open(courses_path, "r", encoding="utf-8") as f:
            courses_content = f.read()
        with open(catalog_config_path, "r", encoding="utf-8") as f:
            catalog_config = json.load(f)
        for key, pattern in [
            ("categoryOptions", r"categoryOptions:\s*(\[[^\]]*\])"),
            ("domainOptions", r"domainOptions:\s*(\[[^\]]*\])"),
        ]:
            parsed = _extract_js_array_literal(courses_content, pattern)
            json_val = catalog_config.get(key)
            if parsed is not None and json_val is not None and parsed != json_val:
                errors.append(
                    f"modules/courses.html hardcoded fallback {key}={parsed!r} "
                    f"!= data/catalog-config.json {key}={json_val!r}"
                )
    return errors


def main():
    errors = check_html_refs() + check_json_data() + check_duplicate_constants()
    if errors:
        print("FAILED:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    print("OK: all local HTML references resolve, all data/*.json valid")


if __name__ == "__main__":
    main()
