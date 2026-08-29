"""
ci_checks.py — CI-only smoke checks for this zero-build static site
(html/css/js + JSON data), stdlib only, no npm/node needed for this part.

1. Every local <script src>/<link href>/<img src> in every .html file must
   resolve to a real file -- with no build step, a typo'd relative path
   only shows up as a silent 404 in the browser console, never as an error
   anywhere else.
2. Every data/*.json file must be valid JSON -- these are hand-edited data
   files (course catalog, scholarships, teachers), not generated.

JS syntax itself is checked separately in the workflow via `node --check`
(Node ships on GitHub's runners; no reason to reimplement a JS parser here).
"""
import json
import os
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


def main():
    errors = check_html_refs() + check_json_data()
    if errors:
        print("FAILED:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    print("OK: all local HTML references resolve, all data/*.json valid")


if __name__ == "__main__":
    main()
