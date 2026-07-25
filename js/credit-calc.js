/**
 * credit-calc.js — 學分加總純函式庫
 *
 * 職責邊界:只做「輸入資料 → 算出數字」的純函式,不碰localStorage、不碰GitHub、不碰DOM。
 * 被 modules/credits.html(學分/勞作中心)與 modules/timetable.html(課表產生器)共用,
 * 確保兩處算出來的數字一定一致(規劃書第5.3節的核心設計理由)。
 *
 * 用法:
 *   CreditCalc.computeTaken(myCourses, '大一上', curriculum.manualFallback)
 *     → { value: 19, source: 'detail' | 'fallback' }
 */
(function (global) {
  "use strict";

  function toNum(v) {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  }

  /** 該學期已選(status=selected)的課程列 */
  function selectedRowsOf(myCourses, semester) {
    return myCourses.filter(
      (c) => c.semester === semester && c.status === "selected" && c.resultStatus !== "withdrawn"
    );
  }

  /**
   * 修習學分:my-courses有明細則加總,否則退回manualFallback。
   * 回傳 { value, source } , source用於UI標示「依課程明細」或「估算值」。
   */
  function computeTaken(myCourses, semester, manualFallback) {
    const rows = selectedRowsOf(myCourses, semester);
    if (rows.length > 0) {
      return { value: rows.reduce((sum, c) => sum + toNum(c.credits), 0), source: "detail" };
    }
    const fb = (manualFallback || {})[semester];
    return { value: fb ? toNum(fb.taken) : 0, source: "fallback" };
  }

  /** 實得學分:同上,但只計resultStatus=passed的課 */
  function computeEarned(myCourses, semester, manualFallback) {
    const rows = selectedRowsOf(myCourses, semester);
    if (rows.length > 0) {
      const passed = rows.filter((c) => c.resultStatus === "passed");
      return { value: passed.reduce((sum, c) => sum + toNum(c.credits), 0), source: "detail" };
    }
    const fb = (manualFallback || {})[semester];
    return { value: fb ? toNum(fb.earned) : 0, source: "fallback" };
  }

  /**
   * 依creditType(系選/必修/非系選...)小計,課表產生器用來畫模擬學分小計。
   * 注意:此函式不篩選status——呼叫端(如課表產生器)需自行先篩好
   * status="selected"(歷史模式)或status="planned"(模擬模式)的子集合再傳入,
   * 這裡只負責對「已經決定好範圍」的課程做creditType加總。
   */
  function computeCreditTypeSubtotal(myCourses, semester, creditType) {
    return myCourses
      .filter((c) => c.semester === semester && c.creditType === creditType)
      .reduce((sum, c) => sum + toNum(c.credits), 0);
  }

  /** 全部學期實得學分加總 */
  function computeTotalEarned(myCourses, semesters, manualFallback) {
    return semesters.reduce((sum, sem) => sum + computeEarned(myCourses, sem, manualFallback).value, 0);
  }

  /** 畢業學分差距(正值=還差多少,負或0=已達標) */
  function computeGraduationGap(myCourses, semesters, manualFallback, graduationThreshold) {
    const totalEarned = computeTotalEarned(myCourses, semesters, manualFallback);
    return graduationThreshold - totalEarned;
  }

  /** 勞作時數:該學期週次hours加總,與應修時數比較,回傳差(可為負=超額) */
  function computeLaborGap(laborWeeksOfSemester, requiredHours) {
    const total = (laborWeeksOfSemester || []).reduce((sum, w) => sum + toNum(w.hours), 0);
    return { total, gap: toNum(requiredHours) - total };
  }

  global.CreditCalc = {
    computeTaken,
    computeEarned,
    computeCreditTypeSubtotal,
    computeTotalEarned,
    computeGraduationGap,
    computeLaborGap,
  };
})(typeof window !== "undefined" ? window : globalThis);
