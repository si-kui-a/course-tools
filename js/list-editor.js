/**
 * list-editor.js — 通用 enum 選項管理彈窗
 *
 * 職責邊界：
 *  - 管理字串陣列（新增/刪除/排序）
 *  - 刪除前檢查「是否有資料正在使用該值」，使用中則拒絕刪除
 *  - 不管資料驗證以外的邏輯，不碰 localStorage（由呼叫端決定資料存哪）
 *
 * 使用方式：
 *   ListEditor.open({
 *     title: '課程類別管理',
 *     options: ['系上選修', '跨域課程', '通識'],
 *     // 傳入函式：檢查某選項目前被幾筆資料使用
 *     usageChecker: (optionValue) => {
 *       return myCoursesData.filter(c => c.category === optionValue).length;
 *     },
 *     onSave: (newOptions) => {
 *       // newOptions: string[]，已排除仍在使用而被拒絕刪除的項目會維持在陣列中
 *       catalogConfig.categoryOptions = newOptions;
 *       Storage.write('catalog-config', catalogConfig);
 *     }
 *   });
 */
const ListEditor = (() => {
  let activeModal = null;

  function closeModal() {
    if (activeModal) {
      activeModal.remove();
      activeModal = null;
    }
  }

  /**
   * 開啟 enum 管理彈窗
   * @param {object} config
   * @param {string} config.title
   * @param {string[]} config.options - 初始選項陣列
   * @param {function} [config.usageChecker] - (value: string) => number，回傳使用中筆數
   * @param {function} config.onSave - (newOptions: string[]) => void
   */
  function open(config) {
    closeModal(); // 確保同時只有一個彈窗

    const { title, onSave } = config;
    const usageChecker = config.usageChecker || (() => 0);
    let options = [...(config.options || [])];

    // ---- 建立 DOM ----
    const overlay = document.createElement('div');
    overlay.className = 'list-editor-overlay';

    const modal = document.createElement('div');
    modal.className = 'list-editor-modal';

    const heading = document.createElement('h3');
    heading.textContent = title;
    modal.appendChild(heading);

    const listEl = document.createElement('ul');
    listEl.className = 'list-editor-items';
    modal.appendChild(listEl);

    function renderList() {
      listEl.innerHTML = '';
      options.forEach((opt, idx) => {
        const li = document.createElement('li');
        li.className = 'list-editor-item';

        const label = document.createElement('span');
        label.textContent = opt;
        li.appendChild(label);

        const upBtn = document.createElement('button');
        upBtn.type = 'button';
        upBtn.textContent = '↑';
        upBtn.className = 'btn btn-secondary';
        upBtn.disabled = idx === 0;
        upBtn.addEventListener('click', () => {
          [options[idx - 1], options[idx]] = [options[idx], options[idx - 1]];
          renderList();
        });
        li.appendChild(upBtn);

        const downBtn = document.createElement('button');
        downBtn.type = 'button';
        downBtn.textContent = '↓';
        downBtn.className = 'btn btn-secondary';
        downBtn.disabled = idx === options.length - 1;
        downBtn.addEventListener('click', () => {
          [options[idx], options[idx + 1]] = [options[idx + 1], options[idx]];
          renderList();
        });
        li.appendChild(downBtn);

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.textContent = '刪除';
        delBtn.className = 'btn btn-danger';
        delBtn.addEventListener('click', () => {
          const usageCount = usageChecker(opt);
          if (usageCount > 0) {
            alert(`無法刪除「${opt}」：目前有 ${usageCount} 筆資料正在使用此選項。\n請先修改或刪除相關資料，再回來刪除此選項。`);
            return;
          }
          if (!confirm(`確定刪除選項「${opt}」？`)) return;
          options.splice(idx, 1);
          renderList();
        });
        li.appendChild(delBtn);

        listEl.appendChild(li);
      });
    }
    renderList();

    // ---- 新增選項區 ----
    const addRow = document.createElement('div');
    addRow.className = 'list-editor-add-row';

    const addInput = document.createElement('input');
    addInput.type = 'text';
    addInput.placeholder = '新增選項…';

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.textContent = '新增';
    addBtn.className = 'btn btn-secondary';
    addBtn.addEventListener('click', () => {
      const val = addInput.value.trim();
      if (!val) return;
      if (options.includes(val)) {
        alert('此選項已存在。');
        return;
      }
      options.push(val);
      addInput.value = '';
      renderList();
    });
    addInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addBtn.click();
      }
    });

    addRow.appendChild(addInput);
    addRow.appendChild(addBtn);
    modal.appendChild(addRow);

    // ---- 底部操作區 ----
    const footer = document.createElement('div');
    footer.className = 'list-editor-footer';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = '取消';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.addEventListener('click', closeModal);

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = '儲存';
    saveBtn.className = 'btn btn-primary';
    saveBtn.addEventListener('click', () => {
      onSave([...options]);
      closeModal();
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);
    modal.appendChild(footer);

    overlay.appendChild(modal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(); // 點擊背景關閉
    });

    document.body.appendChild(overlay);
    activeModal = overlay;
  }

  return { open, close: closeModal };
})();
