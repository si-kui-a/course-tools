/**
 * storage.js — localStorage 讀寫 + 內容 hash 計算
 * 職責邊界：不碰 GitHub API，不碰 UI 渲染
 * UTF-8 no-BOM
 */

const Storage = (() => {
  /** localStorage key 前綴，避免與其他應用衝突 */
  const KEY_PREFIX = 'course-tools:';

  /**
   * 計算字串的 FNV-1a 32-bit hash（用於「未同步」判斷）
   * @param {string} str
   * @returns {string} 8 位 hex 字串
   */
  function hashContent(str) {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
  }

  /**
   * 從 localStorage 讀取資料
   * @param {string} key - 資料鍵名（如 'my-courses'）
   * @returns {any|null}
   */
  function read(key) {
    try {
      const raw = localStorage.getItem(KEY_PREFIX + key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error(`[Storage] read(${key}) failed:`, e);
      return null;
    }
  }

  /**
   * 寫入資料到 localStorage
   * @param {string} key
   * @param {any} data
   * @returns {boolean}
   */
  function write(key, data) {
    try {
      localStorage.setItem(KEY_PREFIX + key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(`[Storage] write(${key}) failed:`, e);
      return false;
    }
  }

  /**
   * 刪除 localStorage 中的資料
   * @param {string} key
   */
  function remove(key) {
    localStorage.removeItem(KEY_PREFIX + key);
  }

  return {
    read,
    write,
    remove,
    hashContent
  };
})();
