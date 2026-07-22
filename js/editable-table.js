/**
 * editable-table.js — 通用可編輯表格元件
 *
 * 職責邊界：
 *  - UI 渲染與互動（新增列 / 刪除列 / 欄位編輯）
 *  - 完全不知道 GitHub 的存在
 *  - 透過 onChange callback 向外通知資料變化
 *
 * 使用方式：
 *   const table = EditableTable.init({
 *     container: document.getElementById('wrap'),
 *     data: Storage.read('scholarships') || [],
 *     schema: {
 *       idField: 'instanceId',        // 新增列時自動填 uuid（可省略）
 *       fields: [
 *         { key: 'name',   label: '名稱', type: 'text'   },
 *         { key: 'amount', label: '金額', type: 'number' },
 *         { key: 'status', label: '狀態', type: 'select',
 *           options: ['未申請', '已申請', '已放棄'] },
 *         { key: 'url',    label: '連結', type: 'url'    },
 *         { key: 'note',   label: '備註', type: 'textarea' },
 *         { key: 'cat',    label: '類別', type: 'text', readonly: true }
 *       ]
 *     },
 *     onChange: (newData) => Storage.write('scholarships', newData),
 *     options: { addLabel: '新增', deleteLabel: '刪除', emptyMessage: '尚無項目。' }
 *   });
 *
 *   table.getData();        // 取得目前資料（深拷貝）
 *   table.setData(arr);     // 外部覆寫資料並重新渲染
 */

const EditableTable = (() => {
  /**
   * 產生簡易 UUID
   */
  function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  }

  /**
   * 建立單一儲存格的編輯控制元件
   * @param {object} field   - schema 欄位定義
   * @param {any}    value   - 初始值
   * @param {function} onCellChange - (newValue) => void
   * @returns {HTMLElement}
   */
  function createCellControl(field, value, onCellChange) {
    if (field.readonly) {
      const span = document.createElement('span');
      span.className = 'cell-readonly';
      span.textContent = value ?? '';
      return span;
    }

    switch (field.type) {
      case 'select': {
        const select = document.createElement('select');
        const options = field.options || [];
        // 若目前值不在選項清單內，先加進去（資料相容）
        const allOptions = (!value || options.includes(value))
          ? options
          : [value, ...options];
        allOptions.forEach(opt => {
          const el = document.createElement('option');
          el.value = opt;
          el.textContent = opt;
          if (opt === value) el.selected = true;
          select.appendChild(el);
        });
        select.addEventListener('change', () => onCellChange(select.value));
        return select;
      }

      case 'number': {
        const input = document.createElement('input');
        input.type = 'number';
        input.value = value ?? '';
        if (field.min  !== undefined) input.min  = field.min;
        if (field.max  !== undefined) input.max  = field.max;
        if (field.step !== undefined) input.step = field.step;
        input.addEventListener('change', () => {
          const v = input.value === '' ? '' : parseFloat(input.value);
          onCellChange(isNaN(v) ? '' : v);
        });
        return input;
      }

      case 'url': {
        const input = document.createElement('input');
        input.type = 'url';
        input.value = value ?? '';
        input.placeholder = 'https://';
        input.addEventListener('change', () => onCellChange(input.value.trim()));
        return input;
      }

      case 'textarea': {
        const ta = document.createElement('textarea');
        ta.value = value ?? '';
        ta.rows = 2;
        ta.addEventListener('change', () => onCellChange(ta.value));
        return ta;
      }

      default: { // 'text' 及其他
        const input = document.createElement('input');
        input.type = 'text';
        input.value = value ?? '';
        if (field.placeholder) input.placeholder = field.placeholder;
        input.addEventListener('change', () => onCellChange(input.value));
        return input;
      }
    }
  }

  /**
   * 初始化可編輯表格
   *
   * @param {object}      config
   * @param {HTMLElement} config.container
   * @param {Array}       config.data
   * @param {object}      config.schema       - { fields: [...], idField?: string }
   * @param {function}    config.onChange     - (newData: Array) => void
   * @param {object}      [config.options]
   * @param {string}      [config.options.addLabel]
   * @param {string}      [config.options.deleteLabel]
   * @param {string}      [config.options.emptyMessage]
   *
   * @returns {{ getData: () => Array, setData: (newData: Array) => void }}
   */
  function init(config) {
    const { container, schema, onChange } = config;
    const opts = Object.assign({
      addLabel: '新增列',
      deleteLabel: '刪除',
      emptyMessage: '尚無資料。'
    }, config.options);

    // 內部狀態：深拷貝，不污染外部原陣列
    let data = JSON.parse(JSON.stringify(config.data || []));

    function notify() {
      onChange(JSON.parse(JSON.stringify(data)));
    }

    function render() {
      container.innerHTML = '';

      // 新增按鈕
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.textContent = opts.addLabel;
      addBtn.className = 'btn btn-secondary mb-2';
      addBtn.addEventListener('click', () => {
        const newRow = {};
        schema.fields.forEach(f => {
          if (f.type === 'select' && f.options?.length) newRow[f.key] = f.options[0];
          else if (f.type === 'number') newRow[f.key] = f.default ?? 0;
          else newRow[f.key] = f.default ?? '';
        });
        if (schema.idField) newRow[schema.idField] = generateId();
        data.push(newRow);
        render();
        notify();
      });
      container.appendChild(addBtn);

      // 空狀態
      if (data.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'text-muted';
        empty.textContent = opts.emptyMessage;
        container.appendChild(empty);
        return;
      }

      // 表格
      const wrap = document.createElement('div');
      wrap.className = 'editable-table-wrap';

      const table = document.createElement('table');
      table.className = 'editable-table';

      // thead
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      schema.fields.forEach(f => {
        const th = document.createElement('th');
        th.textContent = f.label;
        if (f.width) th.style.width = f.width;
        headerRow.appendChild(th);
      });
      const thDel = document.createElement('th');
      thDel.className = 'col-action';
      headerRow.appendChild(thDel);
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // tbody
      const tbody = document.createElement('tbody');
      data.forEach((row, idx) => {
        const tr = document.createElement('tr');
        schema.fields.forEach(f => {
          const td = document.createElement('td');
          td.appendChild(createCellControl(f, row[f.key], (val) => {
            data[idx][f.key] = val;
            notify();
          }));
          tr.appendChild(td);
        });
        // 刪除
        const tdDel = document.createElement('td');
        tdDel.className = 'col-action';
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.textContent = opts.deleteLabel;
        delBtn.className = 'btn btn-danger';
        delBtn.addEventListener('click', () => {
          if (!confirm(`確定刪除第 ${idx + 1} 列？`)) return;
          data.splice(idx, 1);
          render();
          notify();
        });
        tdDel.appendChild(delBtn);
        tr.appendChild(tdDel);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      wrap.appendChild(table);
      container.appendChild(wrap);
    }

    render();

    return {
      getData: () => JSON.parse(JSON.stringify(data)),
      setData: (newData) => {
        data = JSON.parse(JSON.stringify(newData || []));
        render();
      }
    };
  }

  return { init };
})();
