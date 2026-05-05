let students = [];
const SUBJECTS = ["Math", "Physics", "Chemistry", "English", "CS"];
const STORAGE_RESET_VERSION = "demo-attendance-v1";

const REAL_STUDENTS = [
  { ID: "101", Name: "AADARSH KUMAR TIWARI", PresentCount: 0, ExtraCurricularPoints: 72, BehaviourPoints: 16, Math: 85, Physics: 81, Chemistry: 78, English: 74, CS: 82 },
  { ID: "102", Name: "AARTI", PresentCount: 0, ExtraCurricularPoints: 65, BehaviourPoints: 14, Math: 72, Physics: 71, Chemistry: 69, English: 76, CS: 70 },
  { ID: "103", Name: "AARTI KUMARI", PresentCount: 0, ExtraCurricularPoints: 82, BehaviourPoints: 18, Math: 79, Physics: 83, Chemistry: 81, English: 80, CS: 84 },
  { ID: "104", Name: "ABAN AHMAD", PresentCount: 0, ExtraCurricularPoints: 66, BehaviourPoints: 14, Math: 68, Physics: 73, Chemistry: 74, English: 73, CS: 71 },
  { ID: "105", Name: "ADITYA", PresentCount: 0, ExtraCurricularPoints: 91, BehaviourPoints: 19, Math: 91, Physics: 90, Chemistry: 88, English: 82, CS: 87 },
  { ID: "106", Name: "AMAN KUMAR SINGH", PresentCount: 0, ExtraCurricularPoints: 58, BehaviourPoints: 12, Math: 70, Physics: 67, Chemistry: 65, English: 68, CS: 66 },
  { ID: "107", Name: "ARYAN SHARMA", PresentCount: 0, ExtraCurricularPoints: 93, BehaviourPoints: 19, Math: 93, Physics: 92, Chemistry: 90, English: 85, CS: 89 },
  { ID: "108", Name: "AYUSH KUMAR", PresentCount: 0, ExtraCurricularPoints: 68, BehaviourPoints: 15, Math: 75, Physics: 74, Chemistry: 72, English: 70, CS: 74 },
  { ID: "109", Name: "BHAVYA", PresentCount: 0, ExtraCurricularPoints: 87, BehaviourPoints: 18, Math: 80, Physics: 85, Chemistry: 83, English: 88, CS: 85 },
  { ID: "110", Name: "DEEPTI PANDEY", PresentCount: 0, ExtraCurricularPoints: 75, BehaviourPoints: 17, Math: 82, Physics: 79, Chemistry: 77, English: 84, CS: 79 },
  { ID: "111", Name: "DIVYANSHU SONI", PresentCount: 0, ExtraCurricularPoints: 63, BehaviourPoints: 14, Math: 71, Physics: 70, Chemistry: 68, English: 72, CS: 69 },
  { ID: "112", Name: "GAURANG JHA", PresentCount: 0, ExtraCurricularPoints: 88, BehaviourPoints: 18, Math: 87, Physics: 87, Chemistry: 85, English: 83, CS: 86 },
  { ID: "113", Name: "HIMANSHU", PresentCount: 0, ExtraCurricularPoints: 69, BehaviourPoints: 15, Math: 76, Physics: 75, Chemistry: 73, English: 71, CS: 75 },
  { ID: "114", Name: "HIMANSHU YADAV", PresentCount: 0, ExtraCurricularPoints: 60, BehaviourPoints: 13, Math: 69, Physics: 68, Chemistry: 67, English: 66, CS: 68 },
  { ID: "115", Name: "KAVYA BASHODIYA", PresentCount: 0, ExtraCurricularPoints: 85, BehaviourPoints: 18, Math: 78, Physics: 84, Chemistry: 82, English: 86, CS: 81 },
  { ID: "116", Name: "KAVYA SHUKLA", PresentCount: 0, ExtraCurricularPoints: 92, BehaviourPoints: 19, Math: 84, Physics: 89, Chemistry: 88, English: 90, CS: 87 },
  { ID: "117", Name: "KESHAV SINGH", PresentCount: 0, ExtraCurricularPoints: 73, BehaviourPoints: 16, Math: 83, Physics: 81, Chemistry: 79, English: 77, CS: 80 },
  { ID: "118", Name: "KRITIKA YADAV", PresentCount: 0, ExtraCurricularPoints: 76, BehaviourPoints: 17, Math: 81, Physics: 78, Chemistry: 76, English: 82, CS: 78 },
  { ID: "119", Name: "MAYANK ARYA", PresentCount: 0, ExtraCurricularPoints: 64, BehaviourPoints: 14, Math: 73, Physics: 71, Chemistry: 69, English: 68, CS: 70 },
  { ID: "120", Name: "NIRMAL SINGH", PresentCount: 0, ExtraCurricularPoints: 67, BehaviourPoints: 15, Math: 74, Physics: 73, Chemistry: 71, English: 70, CS: 72 },
  { ID: "121", Name: "NITESH MAURYA", PresentCount: 0, ExtraCurricularPoints: 80, BehaviourPoints: 13, Math: 88, Physics: 77, Chemistry: 96, English: 75, CS: 87 },
  { ID: "122", Name: "PIYUSH YADAV", PresentCount: 0, ExtraCurricularPoints: 74, BehaviourPoints: 17, Math: 85, Physics: 82, Chemistry: 80, English: 78, CS: 82 },
  { ID: "123", Name: "PRIYA AHIRWAR", PresentCount: 0, ExtraCurricularPoints: 86, BehaviourPoints: 18, Math: 79, Physics: 86, Chemistry: 84, English: 88, CS: 83 },
  { ID: "124", Name: "RAUNAK KUMAR", PresentCount: 0, ExtraCurricularPoints: 95, BehaviourPoints: 19, Math: 94, Physics: 93, Chemistry: 91, English: 87, CS: 90 },
  { ID: "125", Name: "SANIYA MAHAR", PresentCount: 0, ExtraCurricularPoints: 78, BehaviourPoints: 16, Math: 76, Physics: 77, Chemistry: 75, English: 80, CS: 74 },
  { ID: "126", Name: "SHIVAM YADAV", PresentCount: 0, ExtraCurricularPoints: 66, BehaviourPoints: 14, Math: 71, Physics: 72, Chemistry: 70, English: 68, CS: 69 },
  { ID: "127", Name: "SHYAM LAL", PresentCount: 0, ExtraCurricularPoints: 55, BehaviourPoints: 12, Math: 65, Physics: 66, Chemistry: 64, English: 62, CS: 63 },
  { ID: "128", Name: "SIMRAN KUMARI", PresentCount: 0, ExtraCurricularPoints: 90, BehaviourPoints: 19, Math: 82, Physics: 88, Chemistry: 86, English: 89, CS: 85 }
];

const DEMO_ATTENDANCE_RECORDS = {
  "2026-05-01": [
    "AADARSH KUMAR TIWARI", "AARTI", "AARTI KUMARI", "ABAN AHMAD", "ADITYA",
    "AMAN KUMAR SINGH", "ARYAN SHARMA", "AYUSH KUMAR", "BHAVYA", "DEEPTI PANDEY",
    "DIVYANSHU SONI", "GAURANG JHA", "HIMANSHU", "KAVYA BASHODIYA",
    "KAVYA SHUKLA", "KESHAV SINGH", "KRITIKA YADAV", "NIRMAL SINGH",
    "PIYUSH YADAV", "PRIYA AHIRWAR", "RAUNAK KUMAR", "SANIYA MAHAR",
    "SIMRAN KUMARI"
  ],
  "2026-05-02": [
    "AADARSH KUMAR TIWARI", "AARTI KUMARI", "ABAN AHMAD", "ADITYA",
    "ARYAN SHARMA", "AYUSH KUMAR", "BHAVYA", "DEEPTI PANDEY",
    "GAURANG JHA", "HIMANSHU", "KAVYA SHUKLA", "KESHAV SINGH",
    "KRITIKA YADAV", "MAYANK ARYA", "NIRMAL SINGH", "NITESH MAURYA",
    "PIYUSH YADAV", "PRIYA AHIRWAR", "RAUNAK KUMAR", "SIMRAN KUMARI"
  ],
  "2026-05-03": [
    "AADARSH KUMAR TIWARI", "AARTI", "ADITYA", "ARYAN SHARMA",
    "BHAVYA", "DEEPTI PANDEY", "GAURANG JHA", "KAVYA BASHODIYA",
    "KAVYA SHUKLA", "KESHAV SINGH", "KRITIKA YADAV",
    "NITESH MAURYA", "PIYUSH YADAV", "RAUNAK KUMAR",
    "PRIYA AHIRWAR", "SIMRAN KUMARI"
  ],
  "2026-05-04": [
    "AADARSH KUMAR TIWARI", "AARTI KUMARI", "ABAN AHMAD",
    "ADITYA", "ARYAN SHARMA", "BHAVYA", "GAURANG JHA",
    "KAVYA SHUKLA", "KESHAV SINGH", "KRITIKA YADAV",
    "NIRMAL SINGH", "PIYUSH YADAV", "RAUNAK KUMAR",
    "SIMRAN KUMARI"
  ],
  "2026-05-05": [
    "AADARSH KUMAR TIWARI", "ADITYA", "ARYAN SHARMA",
    "BHAVYA", "GAURANG JHA", "KAVYA SHUKLA",
    "KESHAV SINGH", "KRITIKA YADAV",
    "NITESH MAURYA", "RAUNAK KUMAR", "SIMRAN KUMARI"
  ]
};

const DEMO_LEAVE_REQUESTS = [
  { id: "102", reason: "Sick", status: "Approved", date: "2026-05-02" },
  { id: "106", reason: "Family Function", status: "Approved", date: "2026-05-03" },
  { id: "111", reason: "Medical", status: "Rejected", date: "2026-05-02" },
  { id: "113", reason: "Sick", status: "Approved", date: "2026-05-04" },
  { id: "114", reason: "Travel", status: "Rejected", date: "2026-05-03" },
  { id: "119", reason: "Personal", status: "Approved", date: "2026-05-02" },
  { id: "125", reason: "Medical", status: "Approved", date: "2026-05-05" },
  { id: "126", reason: "Family Work", status: "Rejected", date: "2026-05-01" },
  { id: "127", reason: "Sick", status: "Approved", date: "2026-05-04" }
];

async function loadExcel() {
  try {
    resetExistingLeavesAndAttendance();
    clearOldAnnouncementsAndRemarks();
    if (students.length) return students;
    const response = await fetch("data/students.xlsx", { cache: "no-store" });
    if (!response.ok) throw new Error("Excel file not found");

    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });

    students = rows
      .map(normalizeStudent)
      .map(applyStoredStudentOverrides)
      .filter((student) => student.ID && student.Name);

    if (!students.length) {
      throw new Error("Excel data is empty");
    }

    return students;
  } catch (error) {
    students = REAL_STUDENTS.map(applyStoredStudentOverrides);
    showNotification("Excel failed to load. Built-in student data is active.", "error");
    return students;
  }
}

function resetExistingLeavesAndAttendance() {
  if (localStorage.getItem("storageResetVersion") === STORAGE_RESET_VERSION) return;
  seedDemoAttendanceData();
  localStorage.setItem("storageResetVersion", STORAGE_RESET_VERSION);
}

function clearOldAnnouncementsAndRemarks() {
  if (typeof clearStoredAnnouncementsAndRemarks === "function") {
    clearStoredAnnouncementsAndRemarks();
  }
}

function seedDemoAttendanceData() {
  const presentCounts = {};
  const studentsByName = new Map(REAL_STUDENTS.map((student) => [student.Name.toLowerCase(), student]));

  Object.values(DEMO_ATTENDANCE_RECORDS).forEach((names) => {
    names.forEach((name) => {
      const student = studentsByName.get(String(name).trim().toLowerCase());
      if (!student) return;
      presentCounts[student.ID] = (presentCounts[student.ID] || 0) + 1;
    });
  });

  localStorage.setItem("attendanceRecords", JSON.stringify(DEMO_ATTENDANCE_RECORDS));
  localStorage.setItem("completedAttendanceDates", JSON.stringify(Object.keys(DEMO_ATTENDANCE_RECORDS)));
  localStorage.setItem("leaveRequests", JSON.stringify(DEMO_LEAVE_REQUESTS));
  localStorage.setItem("studentPresentCounts", JSON.stringify(presentCounts));
}

function normalizeStudent(row) {
  return {
    ID: String(row.ID ?? "").trim(),
    Name: String(row.Name ?? "").trim(),
    PresentCount: Number(row.PresentCount) || 0,
    ExtraCurricularPoints: Number(row.ExtraCurricularPoints) || 0,
    BehaviourPoints: Number(row.BehaviourPoints) || 0,
    Math: Number(row.Math) || 0,
    Physics: Number(row.Physics ?? row.Science) || 0,
    Chemistry: Number(row.Chemistry) || 0,
    English: Number(row.English) || 0,
    CS: Number(row.CS) || 0
  };
}

function calculateAverage(student) {
  return SUBJECTS.reduce((total, subject) => total + (Number(student[subject]) || 0), 0) / SUBJECTS.length;
}

function getBehaviourRating(student) {
  const points = Number(student.BehaviourPoints) || 0;
  if (points <= 10) return "Needs Improvement";
  if (points <= 20) return "Good";
  return "Excellent";
}

function getStudentById(id) {
  return students.find((student) => student.ID === String(id).trim()) || null;
}

function getStudentByName(name) {
  return students.find((student) => student.Name.toLowerCase() === String(name).trim().toLowerCase()) || null;
}

function getAllStudents() {
  return [...students];
}

function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getAttendanceRecords() {
  return normalizeAttendanceRecords(readStorage("attendanceRecords", {}));
}

function saveAttendanceRecords(records) {
  writeStorage("attendanceRecords", normalizeAttendanceRecords(records));
}

function getCompletedAttendanceDates() {
  return readStorage("completedAttendanceDates", []);
}

function saveCompletedAttendanceDates(dates) {
  writeStorage("completedAttendanceDates", [...new Set(dates)]);
}

function isAttendanceCompleted(date = todayKey()) {
  return getCompletedAttendanceDates().includes(date);
}

function completeAttendance(date = todayKey()) {
  const records = getAttendanceRecords();
  records[date] = records[date] || [];
  saveAttendanceRecords(records);

  const completedDates = getCompletedAttendanceDates();
  if (!completedDates.includes(date)) {
    saveCompletedAttendanceDates([...completedDates, date]);
  }

  return getDailyStatusCounts(date);
}

function normalizeAttendanceRecords(records) {
  const normalized = {};

  Object.entries(records || {}).forEach(([key, value]) => {
    if (!Array.isArray(value)) return;

    const isDateKey = /^\d{4}-\d{2}-\d{2}$/.test(key);
    if (isDateKey) {
      normalized[key] = [...new Set(value.map((name) => String(name).trim()).filter(Boolean))];
      return;
    }

    value.forEach((stamp) => {
      const date = String(stamp).slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
      normalized[date] = [...new Set([...(normalized[date] || []), key])];
    });
  });

  return normalized;
}

function getStoredPresentCounts() {
  return readStorage("studentPresentCounts", {});
}

function saveStoredPresentCounts(counts) {
  writeStorage("studentPresentCounts", counts);
}

function getStoredBehaviourPoints() {
  return readStorage("studentBehaviourPoints", {});
}

function saveStoredBehaviourPoints(points) {
  writeStorage("studentBehaviourPoints", points);
}

function applyStoredStudentOverrides(student) {
  const presentCounts = getStoredPresentCounts();
  const behaviourPoints = getStoredBehaviourPoints();
  return {
    ...student,
    PresentCount: Number(presentCounts[student.ID] ?? student.PresentCount) || 0,
    BehaviourPoints: Number(behaviourPoints[student.ID] ?? student.BehaviourPoints) || 0
  };
}

function incrementPresentCount(student) {
  student.PresentCount = (Number(student.PresentCount) || 0) + 1;
  const counts = getStoredPresentCounts();
  counts[student.ID] = student.PresentCount;
  saveStoredPresentCounts(counts);
  return student.PresentCount;
}

function updateBehaviourPoints(student, points) {
  const nextPoints = Math.max(0, Number(points) || 0);
  student.BehaviourPoints = nextPoints;
  const storedPoints = getStoredBehaviourPoints();
  storedPoints[student.ID] = nextPoints;
  saveStoredBehaviourPoints(storedPoints);
  return nextPoints;
}

function getRemarks() {
  return readStorage("remarks", {});
}

function saveRemarks(remarks) {
  writeStorage("remarks", remarks);
}

function getLeaveRequests() {
  return readStorage("leaveRequests", []).map((request) => ({
    ...request,
    date: request.date || todayKey()
  }));
}

function saveLeaveRequests(requests) {
  writeStorage("leaveRequests", requests.map((request) => ({
    ...request,
    date: request.date || todayKey()
  })));
}

function isStudentPresentOnDate(student, date = todayKey()) {
  const presentNames = getAttendanceRecords()[date] || [];
  return presentNames.some((name) => String(name).trim().toLowerCase() === student.Name.toLowerCase());
}

function hasApprovedLeaveOnDate(student, date = todayKey()) {
  return getLeaveRequests().some((request) => (
    request.id === student.ID &&
    request.status === "Approved" &&
    request.date === date
  ));
}

function getStudentStatus(student, date = todayKey()) {
  if (isStudentPresentOnDate(student, date)) return "Present";
  if (hasApprovedLeaveOnDate(student, date)) return "Leave";
  return "Absent";
}

function getDailyStatusCounts(date = todayKey()) {
  const counts = {
    total: getAllStudents().length,
    present: 0,
    leave: 0,
    absent: 0
  };

  getAllStudents().forEach((student) => {
    const status = getStudentStatus(student, date);
    if (status === "Present") counts.present += 1;
    if (status === "Leave") counts.leave += 1;
    if (status === "Absent") counts.absent += 1;
  });

  return counts;
}

function markAttendance(name) {
  const student = getStudentByName(name);
  if (!student) {
    showNotification(`Missing student: ${name}`, "error");
    return false;
  }

  const records = getAttendanceRecords();
  const date = todayKey();
  const list = records[date] || [];

  if (isAttendanceCompleted(date)) {
    showNotification("Attendance is already completed for today.", "info");
    return false;
  }

  if (list.some((item) => String(item).trim().toLowerCase() === student.Name.toLowerCase())) {
    showNotification("Attendance already marked today.", "info");
    return false;
  }

  records[date] = [...list, student.Name];
  saveAttendanceRecords(records);
  incrementPresentCount(student);
  showNotification("Attendance Marked", "success");
  return true;
}

function getTodayPresentNames() {
  const key = todayKey();
  const records = getAttendanceRecords();
  return records[key] || [];
}
