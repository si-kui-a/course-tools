/**
 * storage.js — localStorage 讀寫 + 資料型別驗證 + 內容 hash 計算
 * 職責邊界：不碰 GitHub API，不碰 UI 渲染
 * UTF-8 no-BOM
 */

const Storage = (() => {
  /** localStorage key 前綴，避免與其他應用衝突 */
  const KEY_PREFIX = 'course-tools:';

  /** 同步元資訊的 localStorage key */
  const SYNC_META_KEY = 'course-tools:__sync_meta__';

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

  /**
   * 驗證匯入 JSON 資料的型別標記
   * 防止使用者誤把 reviews.json 匯入到 courses 模組
   *
   * 規則：
   *  - 若資料（或陣列第一個元素）含有 `_type` 欄位，則必須與 expectedType 一致
   *  - 無 `_type` 欄位則跳過型別檢查（相容無標記的 catalog.json）
   *  - 空陣列永遠通過
   *
   * @param {any} data - 待驗證資料
   * @param {string} expectedType - 預期類型字串（如 'my-courses-v1'）
   * @returns {{ valid: boolean, error?: string }}
   */
  function validate(data, expectedType) {
    if (!expectedType) {
      return { valid: false, error: '未提供 expectedType' };
    }

    if (Array.isArray(data)) {
      if (data.length === 0) return { valid: true };
      const first = data[0];
      if (typeof first === 'object' && first !== null && first._type) {
        if (first._type !== expectedType) {
          return {
            valid: false,
            error: `資料類型不符：預期 "${expectedType}"，實際 "${first._type}"`
          };
        }
      }
      return { valid: true };
    }

    if (typeof data === 'object' && data !== null) {
      if (data._type && data._type !== expectedType) {
        return {
          valid: false,
          error: `資料類型不符：預期 "${expectedType}"，實際 "${data._type}"`
        };
      }
      return { valid: true };
    }

    return { valid: true };
  }

  /**
   * 計算指定 key 的本地資料 hash
   * @param {string} key
   * @returns {string|null}
   */
  function getLocalHash(key) {
    const raw = localStorage.getItem(KEY_PREFIX + key);
    if (raw === null) return null;
    return hashContent(raw);
  }

  /**
   * 讀取同步元資訊（sha、最後同步時間、hash snapshot）
   * @returns {object} { [key]: { sha, syncedAt, hash } }
   */
  function readSyncMeta() {
    try {
      const raw = localStorage.getItem(SYNC_META_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  /**
   * 更新指定 key 的同步元資訊
   * @param {string} key
   * @param {{ sha?: string, syncedAt?: string, hash?: string }} meta
   */
  function updateSyncMeta(key, meta) {
    const all = readSyncMeta();
    all[key] = Object.assign({}, all[key] || {}, meta);
    try {
      localStorage.setItem(SYNC_META_KEY, JSON.stringify(all));
    } catch (e) {
      console.error('[Storage] updateSyncMeta failed:', e);
    }
  }

  /**
   * 判斷指定 key 的本地資料是否有尚未同步的修改
   * - 無本地資料 → false（乾淨）
   * - 從未同步（無 meta.hash） → true（dirty）
   * - 本地 hash ≠ 上次同步時的 hash → true（dirty）
   * @param {string} key
   * @returns {boolean}
   */
  function isDirty(key) {
    const currentHash = getLocalHash(key);
    if (currentHash === null) return false;
    const meta = readSyncMeta();
    const lastHash = meta[key]?.hash;
    if (!lastHash) return true;
    return currentHash !== lastHash;
  }

  /**
   * 標記目前本地資料為「已同步」（更新 hash snapshot）
   * 通常由 github-sync.js 在成功 PUT 後呼叫
   * @param {string} key
   * @param {string} sha - GitHub API 回傳的最新 sha
   */
  function markSynced(key, sha) {
    const hash = getLocalHash(key);
    updateSyncMeta(key, {
      sha,
      hash,
      syncedAt: new Date().toISOString()
    });
  }

  return {
    read,
    write,
    remove,
    validate,
    getLocalHash,
    hashContent,
    readSyncMeta,
    updateSyncMeta,
    isDirty,
    markSynced
  };
})();
