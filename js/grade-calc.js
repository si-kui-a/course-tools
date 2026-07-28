/**
 * grade-calc.js — 加權成績試算純函式
 *
 * 職責邊界（比照 credit-calc.js/PAT-02）：
 *  - 純函式，零副作用，不碰 DOM，不碰 Storage
 *  - 被 modules/grades.html 使用
 *
 * 計分規則：
 *   - 只計入 status="selected"（已選，非模擬預選）且 resultStatus !== "withdrawn"（非退選）
 *     且已填分數（score 為有效數字）的課程。
 *   - resultStatus="pending"（成績未公布）或"failed"（不及格）只要有填分數，一律計入，
 *     由使用者自行決定是否先留白，不由本函式庫代為判斷「該不該算」。
 *   - 學分加權平均分數（百分制）與加權GPA（4.3制，採一般常見TW大學對照表）分開計算，
 *     兩者都以「學分」加權，與 credit-calc.js 的計分口徑一致。
 */
const GradeCalc = (() => {
  function toNum(v) {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  }

  /** 分數是否為有效數字（""、null、undefined、非數字一律視為未填） */
  function hasValidScore(row) {
    if (row.score === undefined || row.score === null || row.score === '') return false;
    return !isNaN(Number(row.score));
  }

  /** 百分制分數 → 4.3制GPA（常見TW大學對照表，非官方統一標準，僅供估算） */
  function scoreToGpa(score) {
    const s = toNum(score);
    if (s >= 90) return 4.3;
    if (s >= 85) return 4.0;
    if (s >= 80) return 3.7;
    if (s >= 77) return 3.3;
    if (s >= 73) return 3.0;
    if (s >= 70) return 2.7;
    if (s >= 67) return 2.3;
    if (s >= 63) return 2.0;
    if (s >= 60) return 1.7;
    return 0;
  }

  /** 該學期「計分資格」課程列 */
  function eligibleRows(myCourses, semester) {
    return (myCourses || []).filter(
      (c) => c.semester === semester && c.status === 'selected' && c.resultStatus !== 'withdrawn' && hasValidScore(c)
    );
  }

  /** 依學分加權平均分數，rows需已篩選好（見eligibleRows） */
  function computeWeightedAverage(rows) {
    const totalCredits = rows.reduce((sum, c) => sum + toNum(c.credits), 0);
    if (totalCredits === 0) return { value: null, totalCredits: 0 };
    const weightedSum = rows.reduce((sum, c) => sum + toNum(c.credits) * toNum(c.score), 0);
    return { value: weightedSum / totalCredits, totalCredits };
  }

  /** 依學分加權GPA，rows需已篩選好 */
  function computeWeightedGpa(rows) {
    const totalCredits = rows.reduce((sum, c) => sum + toNum(c.credits), 0);
    if (totalCredits === 0) return { value: null, totalCredits: 0 };
    const weightedSum = rows.reduce((sum, c) => sum + toNum(c.credits) * scoreToGpa(c.score), 0);
    return { value: weightedSum / totalCredits, totalCredits };
  }

  /** 單一學期總覽：{avgScore, gpa, totalCredits, courseCount}，無合格資料時avgScore/gpa為null */
  function computeSemesterSummary(myCourses, semester) {
    const rows = eligibleRows(myCourses, semester);
    if (rows.length === 0) return { avgScore: null, gpa: null, totalCredits: 0, courseCount: 0 };
    const avg = computeWeightedAverage(rows);
    const gpa = computeWeightedGpa(rows);
    return { avgScore: avg.value, gpa: gpa.value, totalCredits: avg.totalCredits, courseCount: rows.length };
  }

  /** 跨學期累計總覽，semesters為要納入計算的學期名稱陣列 */
  function computeCumulativeSummary(myCourses, semesters) {
    const rows = semesters.flatMap((sem) => eligibleRows(myCourses, sem));
    if (rows.length === 0) return { avgScore: null, gpa: null, totalCredits: 0, courseCount: 0 };
    const avg = computeWeightedAverage(rows);
    const gpa = computeWeightedGpa(rows);
    return { avgScore: avg.value, gpa: gpa.value, totalCredits: avg.totalCredits, courseCount: rows.length };
  }

  return {
    hasValidScore,
    scoreToGpa,
    eligibleRows,
    computeWeightedAverage,
    computeWeightedGpa,
    computeSemesterSummary,
    computeCumulativeSummary
  };
})();
