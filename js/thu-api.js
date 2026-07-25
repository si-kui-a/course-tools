/**
 * thu-api.js — 東海課程資訊網公開 API 封裝
 * 職責邊界：純 fetch 包裝 + 純函數解析，零依賴，不碰 localStorage、不做 UI 渲染
 */
const ThuApi = (() => {
  const BASE_URL = 'https://course.thu.edu.tw';
  const TIMEOUT_MS = 10000;
  const WEEKDAY_CHARS = '一二三四五六日';

  /**
   * @param {string} path
   * @returns {Promise<any>}
   */
  async function fetchJson(path) {
    const res = await fetch(BASE_URL + path, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) {
      throw new Error(`ThuApi 請求失敗：${res.status} ${path}`);
    }
    return res.json();
  }

  /**
   * @returns {Promise<Array<{year: string, term: string, cnt: string}>>}
   */
  function getTerms() {
    return fetchJson('/api/terms');
  }

  /**
   * @param {string|number} year
   * @param {string|number} term
   * @returns {Promise<Array<{college_code: string, college_label: string, departments: Array<{majrcode: string, majrname: string}>}>>}
   */
  function getDeptTree(year, term) {
    const qs = `year=${encodeURIComponent(year)}&term=${encodeURIComponent(term)}`;
    return fetchJson(`/api/course-list?mode=dept&${qs}`);
  }

  /**
   * @param {string|number} year
   * @param {string|number} term
   * @param {string} majrcode
   * @returns {Promise<Array<object>>}
   */
  function searchCourses(year, term, majrcode) {
    const qs = `majrcode=${encodeURIComponent(majrcode)}&year=${encodeURIComponent(year)}&term=${encodeURIComponent(term)}`;
    return fetchJson(`/api/course-list?mode=simulate&${qs}`);
  }

  /**
   * 解析 timeroom 字串為時段陣列（純函數，無網路呼叫，無法解析時回傳 [{day:"",periods:""}]，不 throw）
   * 格式：{中文星期}/{節次}[教室]，多時段以逗號串接（教室標記選填、丟棄）
   * @param {string} timeroom
   * @returns {Array<{day: string, periods: string}>}
   */
  function parseTimeroom(timeroom) {
    if (!timeroom || typeof timeroom !== 'string') return [{ day: '', periods: '' }];

    const stripped = timeroom.replace(/\[[^\]]*\]/g, '').trim();
    if (!stripped) return [{ day: '', periods: '' }];

    // 在每個「星期字元 + /」之前切段，避免節次本身的逗號（如 "5,6,7"）被誤判為時段分隔
    const weekdayLookahead = new RegExp(`(?=[${WEEKDAY_CHARS}]\\/)`);
    const segments = stripped
      .split(weekdayLookahead)
      .map(seg => seg.replace(/,$/, '').trim())
      .filter(Boolean);

    if (segments.length === 0) return [{ day: '', periods: '' }];

    const result = segments.map(seg => {
      const slashIdx = seg.indexOf('/');
      if (slashIdx === -1) return { day: '', periods: '' };
      return { day: seg.slice(0, slashIdx), periods: seg.slice(slashIdx + 1) };
    });

    return result.length > 0 ? result : [{ day: '', periods: '' }];
  }

  return { getTerms, getDeptTree, searchCourses, parseTimeroom, BASE_URL };
})();
