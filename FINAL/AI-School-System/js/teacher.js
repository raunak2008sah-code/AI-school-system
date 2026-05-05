let activeRemarkStudentId = null;
let activeStudentFilter = "";
let activeSortMode = "";
let attendanceOverviewChart = null;
let studentsPanelContracted = false;

document.addEventListener("DOMContentLoaded", async () => {
  await loadExcel();
  renderTeacherDashboard();
  setTeacherLoading(false);

  document.getElementById("studentSearch").addEventListener("input", (event) => {
    activeStudentFilter = event.target.value;
    renderStudentTable();
  });

  document.getElementById("studentSort").addEventListener("change", (event) => {
    activeSortMode = event.target.value;
    renderStudentTable();
  });

  document.getElementById("cancelRemark").addEventListener("click", closeRemarkModal);
  document.getElementById("saveRemark").addEventListener("click", saveRemark);
  document.getElementById("closePerformance").addEventListener("click", closePerformanceModal);
  document.getElementById("announcementForm").addEventListener("submit", postAnnouncement);
  document.getElementById("toggleStudentsPanel").addEventListener("click", toggleStudentsPanel);
});

function renderTeacherDashboard() {
  refreshTeacherAnalytics();
  renderLeaveRequests();
  renderAnnouncementCards("teacherAnnouncementsList", "No school updates posted yet.");
  renderTeacherSidebarOverview();
}

function setTeacherLoading(isLoading) {
  const loader = document.getElementById("teacherLoading");
  document.querySelectorAll(".teacher-content").forEach((section) => {
    section.classList.toggle("hidden", isLoading);
  });
  if (loader) {
    loader.classList.toggle("hidden", !isLoading);
  }
}

function refreshTeacherAnalytics() {
  renderStats();
  renderAttendanceChart();
  renderAttendanceInsights();
  renderStudentTable();
  renderStudentsCompactSummary();
  renderTeacherSidebarOverview();
}

function getAttendanceStats(date = todayKey()) {
  const counts = getTeacherAttendanceCounts(date);
  return {
    present: counts.present,
    absent: counts.absent,
    leave: counts.leave
  };
}

function hasAttendanceTaken(date = todayKey()) {
  return isAttendanceCompleted(date);
}

function getTeacherStudentStatus(student, date = todayKey()) {
  if (hasAttendanceTaken(date)) {
    return getStudentStatus(student, date);
  }
  if (hasApprovedLeaveOnDate(student, date)) {
    return "Leave";
  }
  return "Not Taken";
}

function getTeacherAttendanceCounts(date = todayKey()) {
  const counts = {
    total: getAllStudents().length,
    present: 0,
    absent: 0,
    leave: 0,
    notTaken: 0
  };

  getAllStudents().forEach((student) => {
    const status = getTeacherStudentStatus(student, date);
    if (status === "Present") counts.present += 1;
    if (status === "Absent") counts.absent += 1;
    if (status === "Leave") counts.leave += 1;
    if (status === "Not Taken") counts.notTaken += 1;
  });

  return counts;
}

function renderStats() {
  const counts = getTeacherAttendanceCounts();
  document.getElementById("totalStudents").textContent = counts.total;
  document.getElementById("presentToday").textContent = counts.present;
  document.getElementById("leaveToday").textContent = counts.leave;
  document.getElementById("absentToday").textContent = counts.absent;
}

function renderAttendanceChart() {
  const canvas = document.getElementById("attendanceOverviewChart");
  const emptyState = document.getElementById("attendanceEmptyState");
  if (!canvas || typeof Chart === "undefined") return;

  const stats = getAttendanceStats();
  const data = [stats.present, stats.absent, stats.leave];
  const attendanceTaken = hasAttendanceTaken();

  canvas.classList.toggle("hidden", !attendanceTaken);
  if (emptyState) {
    emptyState.classList.toggle("hidden", attendanceTaken);
  }
  if (!attendanceTaken) return;

  if (attendanceOverviewChart) {
    attendanceOverviewChart.data.datasets[0].data = data;
    attendanceOverviewChart.update();
    return;
  }

  attendanceOverviewChart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Present", "Absent", "Leave"],
      datasets: [{
        data,
        backgroundColor: ["#16a34a", "#dc2626", "#f59e0b"],
        borderColor: ["#bbf7d0", "#fecaca", "#fde68a"],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: getComputedStyle(document.body).getPropertyValue("--text").trim()
          }
        }
      },
      cutout: "62%"
    }
  });
}

function renderAttendanceInsights() {
  const holder = document.getElementById("attendanceInsights");
  if (!holder) return;

  const counts = getTeacherAttendanceCounts();
  if (!hasAttendanceTaken()) {
    holder.innerHTML = `<p class="muted">Attendance has not been taken today. Use Start Attendance to begin marking students.</p>`;
    return;
  }

  const presentRate = counts.total ? Math.round((counts.present / counts.total) * 100) : 0;
  const leaveText = counts.leave ? `${counts.leave} student${counts.leave === 1 ? "" : "s"} on approved leave.` : "No approved leave today.";
  holder.innerHTML = `
    <p><strong>${presentRate}% present</strong> today.</p>
    <p>${counts.absent} absent after approved leave is excluded.</p>
    <p>${leaveText}</p>
  `;
}

function renderStudentTable() {
  const body = document.getElementById("studentTableBody");
  const notice = document.getElementById("attendanceNotTakenNotice");
  const query = activeStudentFilter.trim().toLowerCase();
  const rows = sortStudents(getAllStudents().filter((student) => student.Name.toLowerCase().includes(query)));

  if (notice) {
    notice.classList.toggle("hidden", hasAttendanceTaken());
  }

  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="15">No students found.</td></tr>`;
    return;
  }

  body.innerHTML = rows.map((student) => {
    const status = getTeacherStudentStatus(student);
    const attendancePercent = getStudentAttendancePercentage(student);
    const lowAttendance = attendancePercent < 75 && getAttendanceTotalDays() > 0;
    const isTopper = isTopperStudent(student);
    return `
      <tr class="student-row ${getStudentStatusRowClass(status)} ${isTopper ? "topper-row" : ""}">
        <td>${student.ID}</td>
        <td><strong class="student-name">${student.Name}</strong>${isTopper ? `<span class="topper-badge">Topper</span>` : ""}</td>
        <td>${renderStudentStatusBadge(status)}</td>
        <td>${student.Math}</td>
        <td>${student.Physics}</td>
        <td>${student.Chemistry}</td>
        <td>${student.English}</td>
        <td>${student.CS}</td>
        <td>${calculateAverage(student).toFixed(1)}</td>
        <td>${student.PresentCount}</td>
        <td><span class="attendance-percent">${attendancePercent.toFixed(1)}%</span></td>
        <td>${lowAttendance ? `<span class="badge danger">&#9888; Low Attendance</span>` : `<span class="muted">OK</span>`}</td>
        <td>
          <div class="inline-edit">
            <input class="small-input" id="behaviour-${student.ID}" type="number" min="0" max="100" value="${student.BehaviourPoints}" aria-label="Behaviour points for ${student.Name}">
            <button class="btn ghost compact" type="button" onclick="saveBehaviourPoints('${student.ID}')">Save</button>
          </div>
        </td>
        <td>${student.ExtraCurricularPoints}</td>
        <td>
          <div class="row-actions">
            <button class="btn ghost" type="button" onclick="openPerformanceModal('${student.ID}')">Performance View</button>
            <button class="btn ghost" type="button" onclick="openRemarkModal('${student.ID}')">Add Remark</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function renderStudentsCompactSummary() {
  const summary = document.getElementById("studentsCompactSummary");
  if (!summary) return;

  const counts = getTeacherAttendanceCounts();
  summary.innerHTML = `
    <div><span>Total</span><strong>${counts.total}</strong></div>
    <div><span>Present</span><strong class="text-success">${counts.present}</strong></div>
    <div><span>Absent</span><strong class="text-danger">${counts.absent}</strong></div>
    <div><span>Leave</span><strong class="text-warning">${counts.leave}</strong></div>
  `;
}

function toggleStudentsPanel() {
  studentsPanelContracted = !studentsPanelContracted;

  const grid = document.querySelector(".teacher-grid");
  const panel = document.getElementById("studentsPanel");
  const summary = document.getElementById("studentsCompactSummary");
  const tableWrap = panel.querySelector(".table-wrap");
  const controls = document.querySelectorAll("#studentSort, #studentSearch");
  const toggle = document.getElementById("toggleStudentsPanel");

  grid.classList.toggle("students-contracted", studentsPanelContracted);
  panel.classList.toggle("students-panel-contracted", studentsPanelContracted);
  summary.classList.toggle("hidden", !studentsPanelContracted);
  tableWrap.classList.toggle("hidden", studentsPanelContracted);
  controls.forEach((control) => control.classList.toggle("hidden", studentsPanelContracted));

  toggle.textContent = studentsPanelContracted ? "Expand" : "Contract";
  toggle.setAttribute("aria-expanded", String(!studentsPanelContracted));
}

function getStudentStatusRowClass(status) {
  if (status === "Present") return "present-row";
  if (status === "Leave") return "leave-row";
  if (status === "Not Taken") return "not-taken-row";
  return "absent-row";
}

function renderStudentStatusBadge(status) {
  const statusClass = status === "Present" ? "success" : status === "Leave" ? "warning" : status === "Not Taken" ? "info" : "danger";
  const icon = status === "Present" ? "&#10004;" : status === "Leave" ? "&#128993;" : status === "Not Taken" ? "&#9711;" : "&#10060;";
  return `<span class="badge ${statusClass}">${icon} ${status}</span>`;
}

function getTopperAverage() {
  const rows = getAllStudents();
  if (!rows.length) return 0;
  return Math.max(...rows.map((student) => calculateAverage(student)));
}

function isTopperStudent(student) {
  return calculateAverage(student) === getTopperAverage();
}

function getAttendanceTotalDays() {
  return Object.keys(getAttendanceRecords()).length;
}

function getStudentAttendancePercentage(student) {
  const totalDays = getAttendanceTotalDays();
  if (!totalDays) return 0;
  return ((Number(student.PresentCount) || 0) / totalDays) * 100;
}

function sortStudents(rows) {
  const sorted = [...rows];
  if (activeSortMode === "marks") {
    return sorted.sort((a, b) => calculateAverage(b) - calculateAverage(a));
  }
  if (activeSortMode === "attendance") {
    return sorted.sort((a, b) => (Number(b.PresentCount) || 0) - (Number(a.PresentCount) || 0));
  }
  if (activeSortMode === "behaviour") {
    return sorted.sort((a, b) => (Number(b.BehaviourPoints) || 0) - (Number(a.BehaviourPoints) || 0));
  }
  return sorted;
}

function openRemarkModal(id) {
  const student = getStudentById(id);
  if (!student) {
    showNotification("Student not found.", "error");
    return;
  }

  activeRemarkStudentId = id;
  document.getElementById("remarkStudentLabel").textContent = `${student.Name} (${student.ID})`;
  document.getElementById("remarkText").value = "";
  document.getElementById("remarkModal").classList.remove("hidden");
}

function closeRemarkModal() {
  activeRemarkStudentId = null;
  document.getElementById("remarkModal").classList.add("hidden");
}

function saveRemark() {
  const text = document.getElementById("remarkText").value.trim();
  if (!activeRemarkStudentId || !text) {
    showNotification("Please write a remark.", "error");
    return;
  }

  const remarks = getRemarks();
  remarks[activeRemarkStudentId] = [...(remarks[activeRemarkStudentId] || []), text];
  saveRemarks(remarks);
  closeRemarkModal();
  showNotification("Remark saved.", "success");
}

function saveBehaviourPoints(id) {
  const student = getStudentById(id);
  const input = document.getElementById(`behaviour-${id}`);
  if (!student || !input) {
    showNotification("Student not found.", "error");
    return;
  }

  updateBehaviourPoints(student, input.value);
  renderStudentTable();
  showNotification("Behaviour points updated.", "success");
}

function openPerformanceModal(id) {
  const student = getStudentById(id);
  if (!student) {
    showNotification("Student not found.", "error");
    return;
  }

  document.getElementById("performanceStudentLabel").textContent = `${student.Name} (${student.ID})`;
  document.getElementById("performanceDetails").innerHTML = `
    <div class="marks-grid performance-grid">
      ${SUBJECTS.map((subject) => `<div class="mark-box"><span>${subject}</span><strong>${student[subject]}</strong></div>`).join("")}
    </div>
    <div class="metric-strip"><span>Average Marks</span><strong>${calculateAverage(student).toFixed(1)}</strong></div>
    <div class="metric-strip"><span>Behaviour</span><strong>${student.BehaviourPoints} - ${getBehaviourRating(student)}</strong></div>
    <div class="metric-strip"><span>Extra-curricular</span><strong>${student.ExtraCurricularPoints}/100</strong></div>
  `;
  document.getElementById("performanceModal").classList.remove("hidden");
}

function closePerformanceModal() {
  document.getElementById("performanceModal").classList.add("hidden");
}

function renderLeaveRequests() {
  const panel = document.getElementById("leaveRequestsPanel");
  const requests = getLeaveRequests();

  if (!requests.length) {
    panel.innerHTML = `<p class="muted">No leave requests yet.</p>`;
    return;
  }

  panel.innerHTML = requests.map((request, index) => {
    const student = getStudentById(request.id);
    const statusClass = request.status === "Approved" ? "success" : request.status === "Rejected" ? "danger" : "warning";
    const actions = request.status === "Pending"
      ? `
        <div class="row-actions">
          <button class="btn success" type="button" onclick="updateLeaveStatus(${index}, 'Approved')">Approve</button>
          <button class="btn danger" type="button" onclick="updateLeaveStatus(${index}, 'Rejected')">Reject</button>
        </div>
      `
      : "";

    return `
      <div class="list-item">
        <strong>${student ? student.Name : "Missing student"} (${request.id})</strong>
        <small>${request.date} - ${request.reason}</small>
        <span class="badge ${statusClass}">${request.status}</span>
        ${actions}
      </div>
    `;
  }).join("");
}

function updateLeaveStatus(index, status) {
  const requests = getLeaveRequests();
  if (!requests[index]) return;
  if (requests[index].status !== "Pending") {
    showNotification("This leave request is already finalized.", "info");
    return;
  }

  requests[index].status = status;
  requests[index].date = requests[index].date || todayKey();
  saveLeaveRequests(requests);
  refreshTeacherAnalytics();
  renderLeaveRequests();
  showNotification(`Leave ${status.toLowerCase()}.`, "success");
}

function postAnnouncement(event) {
  event.preventDefault();

  const titleInput = document.getElementById("announcementTitle");
  const messageInput = document.getElementById("announcementMessage");
  const typeInput = document.getElementById("announcementType");
  const dateInput = document.getElementById("announcementDate");
  const title = titleInput.value.trim();
  const message = messageInput.value.trim();
  const type = typeInput.value || "general";
  const date = dateInput.value;

  if (!title || !message || !date) {
    showNotification("Please fill all announcement fields.", "error");
    return;
  }

  const announcements = getAnnouncements();
  announcements.push({ title, message, date, type });
  saveAnnouncements(announcements);

  titleInput.value = "";
  messageInput.value = "";
  typeInput.value = "general";
  dateInput.value = "";
  renderAnnouncementCards("teacherAnnouncementsList", "No school updates posted yet.");
  renderTeacherSidebarOverview();
  showNotification("New School Update Added", "success");
}

window.addEventListener("storage", (event) => {
  if (event.key === "attendanceRecords" || event.key === "completedAttendanceDates" || event.key === "leaveRequests" || event.key === "studentPresentCounts") {
    refreshTeacherAnalytics();
    renderLeaveRequests();
  }
});
