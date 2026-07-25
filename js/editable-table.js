/**
 * editable-table.js — 通用可編輯表格元件
 *
 * 職責邊界(v5第1節#6明訂):
 *   只管「畫面渲染 + 讀寫傳入的資料陣列」,完全不知道 localStorage 或 GitHub 的存在。
 *   是否要存檔、要不要同步,一律由呼叫端(模組頁)透過 onChange callback 自行決定。
 *
 * 用法:
 *   const table = new EditableTable(document.getElementById('slot'), {
 *     fields: [
 *       { key: 'name',       label: '課名',   type: 'text' },
 *       { key: 'credits',    label: '學分',   type: 'number' },
 *       { key: 'creditType', label: '學分類別', type: 'select', options: ['系選','必修','非系選'] },
 *     ],
 *     data: [...],                 // 一開始的資料陣列
 *     onChange: (newData) => {...} // 任何新增/編輯/刪除後都會呼叫,newData為最新完整陣列
 *   });
 *   table.setData(otherData);      // 外部(如載入雲端版本、衝突解決後)覆蓋整份資料並重繪
 *   table.getData();               // 取得目前資料
 */
(function (global) {
  "use strict";

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (k === "class") node.className = attrs[k];
        else if (k === "text") node.textContent = attrs[k];
        else node.setAttribute(k, attrs[k]);
      }
    }
    (children || []).forEach((c) => c && node.appendChild(c));
    return node;
  }

  class EditableTable {
    /**
     * @param {HTMLElement} container
     * @param {Object} opts
     * @param {Array}  opts.fields   欄位schema: [{key,label,type:'text'|'number'|'select',options}]
     * @param {Array}  opts.data     初始資料陣列(每筆是一個物件)
     * @param {Function} opts.onChange  (newData) => void,資料異動後呼叫
     * @param {Function} [opts.newRowDefaults] () => object,新增列時的預設值產生器
     * @param {string} [opts.emptyText]  無資料時顯示的文字
     */
    constructor(container, opts) {
      this.container = container;
      this.fields = opts.fields;
      this.data = Array.isArray(opts.data) ? opts.data.slice() : [];
      this.onChange = opts.onChange || function () {};
      this.newRowDefaults = opts.newRowDefaults || (() => ({}));
      this.emptyText = opts.emptyText || "尚無資料,點下方「新增一列」開始建立。";
      this.showAddRow = opts.showAddRow !== false; // 預設顯示「新增一列」,catalog瀏覽區可關閉
      // rowActions: 自訂列按鈕,如「加入我的預選」。每個action: {label, title, onClick(row, realIndex)}
      // 注意:此為顯示用的額外按鈕,元件本身仍完全不知道按鈕背後做了什麼(維持職責邊界)
      this.rowActions = opts.rowActions || [];
      // filterFn: (row) => boolean,只影響「畫面顯示哪些列」,不影響底層 this.data,
      // 避免「篩選後編輯,索引對不上原始資料」的常見錯誤(見第二階段設計筆記)
      this.filterFn = opts.filterFn || null;
      this.render();
    }

    /** 更新篩選條件並重繪(不動資料本身) */
    setFilter(filterFn) {
      this.filterFn = filterFn;
      this.render();
    }

    getData() {
      return this.data.slice();
    }

    /** 外部覆蓋整份資料(例如:載入雲端版本、衝突解決後),不觸發onChange(避免立刻又寫回) */
    setData(newData) {
      this.data = Array.isArray(newData) ? newData.slice() : [];
      this.render();
    }

    _emit() {
      this.onChange(this.getData());
    }

    _updateCell(rowIndex, key, rawValue, type) {
      const row = this.data[rowIndex];
      if (!row) return;
      row[key] = type === "number" ? (rawValue === "" ? "" : Number(rawValue)) : rawValue;
      this._emit();
    }

    addRow() {
      this.data.push(this.newRowDefaults());
      this.render();
      this._emit();
    }

    /** 從外部推入一筆「已經決定好內容」的資料列(如:從catalog複製一筆到my-courses),
     *  與addRow()的差別是不使用newRowDefaults,而是呼叫端直接指定完整內容。 */
    pushRow(rowObj) {
      this.data.push(rowObj);
      this.render();
      this._emit();
    }

    deleteRow(rowIndex) {
      this.data.splice(rowIndex, 1);
      this.render();
      this._emit();
    }

    _renderCellInput(row, rowIndex, field) {
      let input;
      if (field.type === "select") {
        input = el("select", { class: "et-cell" });
        (field.options || []).forEach((opt) => {
          const optionEl = el("option", { value: opt, text: opt });
          if (row[field.key] === opt) optionEl.selected = true;
          input.appendChild(optionEl);
        });
        input.addEventListener("change", (e) =>
          this._updateCell(rowIndex, field.key, e.target.value, field.type)
        );
      } else {
        input = el("input", {
          class: "et-cell" + (field.mono ? " is-code" : ""),
          type: field.type === "number" ? "number" : "text",
          "data-type": field.type,
          value: row[field.key] === undefined || row[field.key] === null ? "" : row[field.key],
        });
        input.addEventListener("change", (e) =>
          this._updateCell(rowIndex, field.key, e.target.value, field.type)
        );
      }
      return input;
    }

    render() {
      this.container.innerHTML = "";
      const wrap = el("div", { class: "et-wrap" });

      // 篩選只決定「顯示哪些列」,realIndex 永遠指回 this.data 的真實位置,
      // 新增/刪除/編輯一律用 realIndex,不會因為篩選中而錯位。
      const visible = this.data
        .map((row, realIndex) => ({ row, realIndex }))
        .filter(({ row }) => !this.filterFn || this.filterFn(row));

      if (visible.length === 0) {
        wrap.appendChild(
          el("div", {
            class: "et-empty",
            text: this.data.length === 0 ? this.emptyText : "沒有符合篩選條件的資料。",
          })
        );
      } else {
        const table = el("table", { class: "et-table" });
        const thead = el("thead");
        const headRow = el("tr");
        this.fields.forEach((f) => headRow.appendChild(el("th", { text: f.label })));
        headRow.appendChild(el("th", { text: "" }));
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = el("tbody");
        visible.forEach(({ row, realIndex }) => {
          const tr = el("tr");
          this.fields.forEach((field) => {
            const td = el("td");
            td.appendChild(this._renderCellInput(row, realIndex, field));
            tr.appendChild(td);
          });
          const actionTd = el("td", { class: "et-col-actions" });
          this.rowActions.forEach((action) => {
            const btn = el("button", {
              class: "et-del-btn",
              type: "button",
              title: action.title || action.label,
              text: action.label,
            });
            btn.addEventListener("click", () => action.onClick(row, realIndex, this.getData()));
            actionTd.appendChild(btn);
          });
          const delBtn = el("button", { class: "et-del-btn", type: "button", title: "刪除此列", text: "✕" });
          delBtn.addEventListener("click", () => this.deleteRow(realIndex));
          actionTd.appendChild(delBtn);
          tr.appendChild(actionTd);
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        wrap.appendChild(table);
      }

      if (this.showAddRow) {
        const addRowBar = el("div", { class: "et-add-row" });
        const addBtn = el("button", { class: "et-add-btn", type: "button", text: "＋ 新增一列" });
        addBtn.addEventListener("click", () => this.addRow());
        addRowBar.appendChild(addBtn);
        wrap.appendChild(addRowBar);
      }

      this.container.appendChild(wrap);
    }
  }

  global.EditableTable = EditableTable;
})(window);
