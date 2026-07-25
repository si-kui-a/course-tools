// 首次使用者的示範資料。與timetable/grades等模組共用,確保初次開啟時各模組資料一致。
// isDemo:true 標記每筆課程為示範資料,供之後統計邏輯排除或提示使用。

const FALLBACK_MYCOURSES = [
  { instanceId: "demo1", semester: "大二上", status: "selected", creditType: "系選", credits: 3, name: "文化人類學", teacher: "趙彥寧", day: "一", periods: "2,3,4", resultStatus: "passed", score: 88, isDemo: true },
  { instanceId: "demo2", semester: "大二上", status: "selected", creditType: "必修", credits: 2, name: "社會統計學", teacher: "王老師", day: "三", periods: "5,6", resultStatus: "pending", score: "", isDemo: true },
  { instanceId: "demo3", semester: "大二上", status: "planned", creditType: "非系選", credits: 2, name: "建築實例分析", teacher: "盧澤彥", day: "二", periods: "3,4", resultStatus: "pending", score: "", isDemo: true },
  { instanceId: "demo4", semester: "大二上", status: "selected", creditType: "系選", credits: 3, name: "衝堂測試課", teacher: "測試老師", day: "一", periods: "2", resultStatus: "pending", score: "", isDemo: true },
];