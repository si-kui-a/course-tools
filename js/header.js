/**
 * header.js — 共用導覽列
 * 職責邊界：注入頂部導覽列（依 activeKey 高亮），不碰資料邏輯、不碰 localStorage
 */
const AppHeader = (() => {
  const NAV_ITEMS = [
    { key: 'courses',      label: '課程資料庫',    fromRoot: 'modules/courses.html',      fromModule: 'courses.html' },
    { key: 'timetable',    label: '課表產生器',    fromRoot: 'modules/timetable.html',    fromModule: 'timetable.html' },
    { key: 'credits',      label: '學分 / 勞作中心', fromRoot: 'modules/credits.html',      fromModule: 'credits.html' },
    { key: 'reviews',      label: '老師評價',      fromRoot: 'modules/reviews.html',      fromModule: 'reviews.html' },
    { key: 'grades',       label: '加權成績試算',   fromRoot: 'modules/grades.html',       fromModule: 'grades.html' },
    { key: 'scholarships', label: '獎助 / 實習追蹤', fromRoot: 'modules/scholarships.html', fromModule: 'scholarships.html' },
    { key: 'settings',     label: 'Token 設定',    fromRoot: 'modules/settings.html',     fromModule: 'settings.html' }
  ];

  /**
   * 注入導覽列
   * @param {object} config
   * @param {string} [config.activeKey] - 對應 NAV_ITEMS 的 key，命中則加上 active class
   * @param {boolean} [config.inModule] - true 表示目前頁面位於 modules/ 目錄下（影響連結路徑與回首頁路徑）
   */
  function init(config) {
    const { activeKey, inModule } = config || {};
    const container = document.getElementById('app-header');
    if (!container) return;

    container.innerHTML = '';

    const homeLink = document.createElement('a');
    homeLink.href = inModule ? '../index.html' : 'index.html';
    homeLink.className = 'app-header-brand';
    homeLink.textContent = '學分工具';
    container.appendChild(homeLink);

    const nav = document.createElement('nav');
    nav.className = 'app-header-nav';
    NAV_ITEMS.forEach(item => {
      const a = document.createElement('a');
      a.href = inModule ? item.fromModule : item.fromRoot;
      a.textContent = item.label;
      a.className = 'app-header-nav-link' + (item.key === activeKey ? ' active' : '');
      nav.appendChild(a);
    });
    container.appendChild(nav);
  }

  return { init, NAV_ITEMS };
})();
