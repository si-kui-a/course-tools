/**
 * storage.js — 本地儲存共用元件
 *
 * 職責(僅限於此,不碰GitHub、不碰UI渲染):
 *   1. 讀寫 localStorage,並在每筆資料外包一層 envelope,內含 `_type` 供匯入/讀取時驗證
 *   2. 計算內容雜湊(hash),供「是否有未同步變更」判斷使用(見第5節整合稽核 #5)
 *   3. 記錄/讀取「同步中介資料」(sync_meta) —— 這是本地專屬的版本追蹤資訊,
 *      絕對不寫入實際資料內容、也絕對不會被同步上傳到 GitHub(見v5第1節#3的修正)
 *
 * 用法:
 *   Storage.save('my-courses', dataArray, 'my-courses')
 *   const { data, type } = Storage.load('my-courses')
 *   Storage.getSyncMeta('my-courses')  → { lastSha, lastSyncTime, lastSyncedHash }
 *   Storage.setSyncMeta('my-courses', { lastSha, lastSyncTime, lastSyncedHash })
 *   Storage.hasUnsyncedChanges('my-courses') → true/false
 */
(function (global) {
  "use strict";

  const PREFIX = "ctool_data_";       // 實際資料內容的 localStorage key 前綴
  const META_PREFIX = "ctool_meta_";  // 同步中介資料的 localStorage key 前綴(獨立命名空間,永不混放)

  /** 簡易但足夠穩定的字串雜湊(FNV-1a 變體),僅用於「內容是否改變」比對,非密碼學用途 */
  function hashString(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16);
  }

  function hashOf(data) {
    return hashString(JSON.stringify(data));
  }

  /**
   * 儲存資料。data 一律包成 envelope: { _type, savedAt, payload }
   * _type 用來在載入/匯入時檢查「這份資料是不是我以為的那份」,
   * 避免像 v3 第5節風險6 所述:使用者把 curriculum.json 誤匯入成 my-courses 模組。
   */
  function save(key, payload, type) {
    const envelope = {
      _type: type,
      savedAt: new Date().toISOString(),
      payload: payload,
    };
    try {
      global.localStorage.setItem(PREFIX + key, JSON.stringify(envelope));
      return true;
    } catch (err) {
      console.error("[storage.js] 儲存失敗:", err);
      return false;
    }
  }

  /**
   * 讀取資料。回傳 { payload, type, savedAt } 或 null(尚未存過)。
   * 若傳入 expectedType 且不吻合,回傳 { error: 'type_mismatch', ... } 而非直接丟資料出去。
   */
  function load(key, expectedType) {
    let raw;
    try {
      raw = global.localStorage.getItem(PREFIX + key);
    } catch (err) {
      console.error("[storage.js] 讀取失敗:", err);
      return null;
    }
    if (!raw) return null;
    let envelope;
    try {
      envelope = JSON.parse(raw);
    } catch (err) {
      console.error("[storage.js] 內容毀損,無法解析:", err);
      return { error: "corrupted" };
    }
    if (expectedType && envelope._type !== expectedType) {
      return { error: "type_mismatch", foundType: envelope._type, expectedType };
    }
    return { payload: envelope.payload, type: envelope._type, savedAt: envelope.savedAt };
  }

  /** 匯入外部JSON檔(使用者手動選檔上傳,或GitHub讀回)時的驗證入口,邏輯同save,但明確語意為「匯入」 */
  function importData(key, rawJsonText, expectedType) {
    let parsed;
    try {
      parsed = JSON.parse(rawJsonText);
    } catch (err) {
      return { ok: false, reason: "invalid_json" };
    }
    // 允許匯入「原始payload」或「完整envelope」兩種格式,提升相容性
    const payload = parsed && parsed._type ? parsed.payload : parsed;
    const type = parsed && parsed._type ? parsed._type : expectedType;
    if (expectedType && type !== expectedType) {
      return { ok: false, reason: "type_mismatch", foundType: type };
    }
    save(key, payload, type);
    return { ok: true, payload };
  }

  /** 匯出:回傳可直接下載存檔的純payload JSON字串(不含envelope,因為要commit回GitHub的是乾淨內容) */
  function exportPayloadString(key) {
    const result = load(key);
    if (!result || result.error) return null;
    return JSON.stringify(result.payload, null, 2);
  }

  // ---------------- 同步中介資料(sync_meta),獨立命名空間 ----------------

  function getSyncMeta(key) {
    try {
      const raw = global.localStorage.getItem(META_PREFIX + key);
      return raw ? JSON.parse(raw) : { lastSha: null, lastSyncTime: null, lastSyncedHash: null };
    } catch (err) {
      return { lastSha: null, lastSyncTime: null, lastSyncedHash: null };
    }
  }

  function setSyncMeta(key, meta) {
    try {
      global.localStorage.setItem(META_PREFIX + key, JSON.stringify(meta));
      return true;
    } catch (err) {
      console.error("[storage.js] 同步中介資料寫入失敗:", err);
      return false;
    }
  }

  /**
   * 判斷是否有未同步變更:比對「目前payload的hash」與「上次成功同步時記錄的hash」。
   * 採整份內容比對,不做欄位級別比對(見v5第5節風險5的簡化決策)。
   */
  function hasUnsyncedChanges(key) {
    const result = load(key);
    if (!result) return false; // 從未存過資料,談不上未同步
    if (result.error) {
      // 損毀資料 不等於 已同步。丟出去讓上層決定要不要顯示 banner
      try {
        if (typeof window !== "undefined" && window.ErrorBanner) {
          window.ErrorBanner.show("偵測到資料損毀（key: " + key + "），已避免覆寫，請檢查來源。");
        }
      } catch (e) {}
      return true; // 資料已損毀或型別不符,視為需要人工介入,顯示為未同步
    }
    const meta = getSyncMeta(key);
    if (!meta.lastSyncedHash) return true; // 從未同步過,視為有變更待同步
    return hashOf(result.payload) !== meta.lastSyncedHash;
  }

  global.Storage = {
    save,
    load,
    importData,
    exportPayloadString,
    getSyncMeta,
    setSyncMeta,
    hasUnsyncedChanges,
    hashOf,
  };
})(window);
