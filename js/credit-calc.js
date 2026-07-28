/**
 * credit-calc.js — 學分加總純函式
 *
 * 職責邊界（PAT-02 / HARD CONSTRAINT #5）：
 *  - 純函式，零副作用，不碰 DOM，不碰 Storage
 *  - 所有輸入透過參數傳入，所有輸出為 return 值
 *  - 被 timetable.html 與 credits.html 共用，確保兩處數字一致
 *
 * 資料結構假設（對應規劃書 4.4 / 4.5 節）：
 *   myCourses: Array<{
 *     semester: string, status: 'planned'|'selected',
 *     creditType: string, credits: number, resultStatus: 'pending'|'passed'|'failed'|'withdrawn'
 *   }>
 *   manualFallback: { [semester]: { taken: number, earned: number } }
 */
const CreditCalc = (() => {
  /**
   * 篩選指定學期、狀態為 selected 的課程
   * @param {Array} myCourses
   * @param {string} semester
   * @returns {Array}
   */
  function selectedCoursesOf(myCourses, semester) {
    return (myCourses || []).filter(c => c.semester === semester && c.status === 'selected');
  }

  /**
   * 計算指定學期 + 學分類別的小計（規劃書 5.2 節運作邏輯）
   * 用於課表產生器的系選/必修/非系選小計
   * @param {Array} myCourses
   * @param {string} semester
   * @param {string} creditType - 如 '系選'/'必修'/'非系選'
   * @returns {number}
   */
  function creditTypeSubtotal(myCourses, semester, creditType) {
    return selectedCoursesOf(myCourses, semester)
      .filter(c => c.creditType === creditType)
      .reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
  }

  /**
   * 計算指定學期的多個學分類別小計（一次算好課表產生器要顯示的全部類別）
   * @param {Array} myCourses
   * @param {string} semester
   * @param {string[]} creditTypes - 如 ['系選','必修','非系選']
   * @returns {{ [creditType]: number }}
   */
  function creditTypeBreakdown(myCourses, semester, creditTypes) {
    const result = {};
    creditTypes.forEach(type => {
      result[type] = creditTypeSubtotal(myCourses, semester, type);
    });
    return result;
  }

  /**
   * 計算指定學期「修習學分」(taken)
   * 規劃書 5.3 節：若 my-courses 有該學期 selected 紀錄 → Σ(credits)；否則 → manualFallback
   *
   * @param {Array} myCourses
   * @param {string} semester
   * @param {object} manualFallback - curriculum.manualFallback
   * @returns {{ value: number, isEstimated: boolean }}
   */
  function taken(myCourses, semester, manualFallback) {
    const selected = selectedCoursesOf(myCourses, semester);
    if (selected.length > 0) {
      const sum = selected.reduce((s, c) => s + (Number(c.credits) || 0), 0);
      return { value: sum, isEstimated: false };
    }
    const fallback = manualFallback?.[semester]?.taken;
    return { value: typeof fallback === 'number' ? fallback : 0, isEstimated: true };
  }

  /**
   * 計算指定學期「實得學分」(earned)
   * 規劃書 5.3 節：若 my-courses 有該學期 selected 紀錄 → Σ(credits where resultStatus="passed")；否則 → manualFallback
   *
   * @param {Array} myCourses
   * @param {string} semester
   * @param {object} manualFallback
   * @returns {{ value: number, isEstimated: boolean }}
   */
  function earned(myCourses, semester, manualFallback) {
    const selected = selectedCoursesOf(myCourses, semester);
    if (selected.length > 0) {
      const sum = selected
        .filter(c => c.resultStatus === 'passed')
        .reduce((s, c) => s + (Number(c.credits) || 0), 0);
      return { value: sum, isEstimated: false };
    }
    const fallback = manualFallback?.[semester]?.earned;
    return { value: typeof fallback === 'number' ? fallback : 0, isEstimated: true };
  }

  /**
   * 計算全部學期的 earned 總和（用於畢業門檻比對）
   * @param {Array} myCourses
   * @param {string[]} semesters - 8 學期清單
   * @param {object} manualFallback
   * @returns {{ total: number, perSemester: { [semester]: { value: number, isEstimated: boolean } } }}
   */
  function totalEarned(myCourses, semesters, manualFallback) {
    const perSemester = {};
    let total = 0;
    semesters.forEach(sem => {
      const r = earned(myCourses, sem, manualFallback);
      perSemester[sem] = r;
      total += r.value;
    });
    return { total, perSemester };
  }

  /**
   * 計算未取得總學分（規劃書 5.3 節）
   * @param {number} graduationThreshold
   * @param {number} totalEarnedValue
   * @returns {number}
   */
  function remainingCredits(graduationThreshold, totalEarnedValue) {
    return graduationThreshold - totalEarnedValue;
  }

  /**
   * 計算勞作時數週次加總
   * @param {Array<{hours: number, count?: number}>} weeks - curriculum.laborWork[semester].weeks
   * @returns {number}
   */
  function laborHoursSum(weeks) {
    return (weeks || []).reduce((sum, w) => {
      const hours = Number(w.hours) || 0;
      const count = Number(w.count) || 1;
      return sum + hours * count;
    }, 0);
  }

  /**
   * 計算未取得勞作時數（規劃書 5.3 節）
   * @param {Array} weeks
   * @param {number} requiredHours
   * @returns {number}
   */
  function laborHoursRemaining(weeks, requiredHours) {
    return requiredHours - laborHoursSum(weeks);
  }

  /**
   * 偵測課表衝堂：同一天同一節次出現兩門(含)以上課程
   * @param {Array} myCourses - 已篩選 status=selected 的課程，每筆含 slots: Array<{day, periods}>
   *   (課程可能跨多天/多時段，如東海課程"一/B,三/5,6,7"對應兩筆slots)
   * @returns {Array<{ day: string, period: string, courses: Array }>} 衝堂清單
   */
  function detectConflicts(myCourses) {
    const slotMap = {}; // key: "day-period" → [course, ...]
    (myCourses || []).forEach(course => {
      (course.slots || []).forEach(slot => {
        const periods = String(slot.periods || '').split(',').map(p => p.trim()).filter(Boolean);
        periods.forEach(period => {
          const key = `${slot.day}-${period}`;
          if (!slotMap[key]) slotMap[key] = [];
          slotMap[key].push(course);
        });
      });
    });
    const conflicts = [];
    Object.entries(slotMap).forEach(([key, courses]) => {
      if (courses.length > 1) {
        const [day, period] = key.split('-');
        conflicts.push({ day, period, courses });
      }
    });
    return conflicts;
  }

  return {
    selectedCoursesOf,
    creditTypeSubtotal,
    creditTypeBreakdown,
    taken,
    earned,
    totalEarned,
    remainingCredits,
    laborHoursSum,
    laborHoursRemaining,
    detectConflicts
  };
})();
