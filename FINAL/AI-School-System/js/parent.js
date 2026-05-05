let marksChart = null;
let parentAttendanceChart = null;
let activeParentStudent = null;

document.addEventListener("DOMContentLoaded", async () => {
  await loadExcel();
  const id = localStorage.getItem("currentStudentId");
  const student = getStudentById(id);

  if (!student) {
    showNotification("Missing student. Please login again.", "error");
    setTimeout(goToLogin, 1200);
    return;
  }

  activeParentStudent = student;
  renderParentDashboard(student);
  setupPerformanceTabs();
  document.getElementById("leaveForm").addEventListener("submit", (event) => submitLeave(event, student));
});

function renderParentDashboard(student) {
  document.getElementById("parentTitle").textContent = `${student.Name}'s Profile`;
  renderParentSidebarProfile(student);
  renderPerformanceSummary(student);
  renderParentAttendanceChart(student);
  renderPerformanceInsights(student);
  renderLeaveSummary(student);
  renderStudentInfo(student);
  renderMarksChart(student);
  renderExtraCurricular(student);
  renderBehaviour(student);
  renderRemarks(student);
  renderLeaveStatus(student);
  renderAttendanceHistory(student);
}

function renderParentSidebarProfile(student) {
  const name = document.getElementById("parentSidebarName");
  const avatar = document.getElementById("parentSidebarAvatar");

  if (name) {
    name.textContent = `Parent of ${student.Name}`;
  }
  if (avatar) {
    avatar.textContent = getInitials(student.Name);
  }
}

function renderPerformanceSummary(student) {
  const average = calculateAverage(student);
  const attendancePercent = getParentAttendancePercentage(student);
  document.getElementById("performanceSummary").innerHTML = `
    <article class="stat-card erp-card"><span>&#10004; Present Count</span><strong>${student.PresentCount}</strong></article>
    <article class="stat-card erp-card success"><span>&#128200; Attendance %</span><strong>${attendancePercent.toFixed(1)}%</strong></article>
    <article class="stat-card erp-card success"><span>Average Marks</span><strong>${average.toFixed(1)}</strong></article>
    <article class="stat-card erp-card ${getBehaviourClass(student.BehaviourPoints)}"><span>Behaviour Rating</span><strong>${getBehaviourRating(student)}</strong></article>
  `;
}

function getParentAttendanceStats(student) {
  const records = getAttendanceRecords();
  const requests = getLeaveRequests().filter((request) => request.id === student.ID);
  const dates = getParentAttendanceDates(student, records, requests);
  const approvedLeaveDates = new Set(requests
    .filter((request) => request.status === "Approved")
    .map((request) => request.date));

  const stats = {
    present: 0,
    absent: 0,
    leave: 0,
    totalDays: dates.length
  };

  dates.forEach((date) => {
    const presentNames = records[date] || [];
    const isPresent = presentNames.some((name) => String(name).trim().toLowerCase() === student.Name.toLowerCase());
    if (isPresent) {
      stats.present += 1;
    } else if (approvedLeaveDates.has(date)) {
      stats.leave += 1;
    } else {
      stats.absent += 1;
    }
  });

  return stats;
}

function getParentAttendanceDates(student, records = getAttendanceRecords(), requests = getLeaveRequests().filter((request) => request.id === student.ID)) {
  const dateSet = new Set([
    ...Object.keys(records),
    ...(typeof getCompletedAttendanceDates === "function" ? getCompletedAttendanceDates() : [])
  ]);
  requests.forEach((request) => {
    if (request.date && request.status !== "Pending") {
      dateSet.add(request.date);
    }
  });
  return [...dateSet].sort((a, b) => b.localeCompare(a));
}

function getParentAttendancePercentage(student) {
  const stats = getParentAttendanceStats(student);
  if (!stats.totalDays) return 0;
  return (stats.present / stats.totalDays) * 100;
}

function renderParentAttendanceChart(student) {
  const canvas = document.getElementById("parentAttendanceChart");
  const empty = document.getElementById("parentAttendanceEmpty");
  if (!canvas || typeof Chart === "undefined") return;

  const stats = getParentAttendanceStats(student);
  const hasRecords = stats.totalDays > 0;
  canvas.classList.toggle("hidden", !hasRecords);
  if (empty) {
    empty.classList.toggle("hidden", hasRecords);
  }
  if (!hasRecords) return;

  const data = [stats.present, stats.absent, stats.leave];
  if (parentAttendanceChart) {
    parentAttendanceChart.data.datasets[0].data = data;
    parentAttendanceChart.update();
    return;
  }

  parentAttendanceChart = new Chart(canvas, {
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

function renderPerformanceInsights(student) {
  const holder = document.getElementById("performanceInsights");
  if (!holder) return;

  const subjectRows = SUBJECTS
    .map((subject) => ({ subject, score: Number(student[subject]) || 0 }))
    .sort((a, b) => b.score - a.score);
  const best = subjectRows[0];
  const weak = subjectRows[subjectRows.length - 1];
  const attendancePercent = getParentAttendancePercentage(student);

  holder.innerHTML = `
    <div class="insight-item"><span>Best Subject</span><strong>${best.subject} (${best.score})</strong></div>
    <div class="insight-item"><span>Weak Subject</span><strong>${weak.subject} (${weak.score})</strong></div>
    <div class="insight-item"><span>Attendance</span><strong>${attendancePercent.toFixed(1)}%</strong></div>
  `;
}

function renderLeaveSummary(student) {
  const holder = document.getElementById("leaveSummaryPanel");
  if (!holder) return;

  const requests = getLeaveRequests().filter((request) => request.id === student.ID);
  const summary = {
    Approved: 0,
    Pending: 0,
    Rejected: 0
  };

  requests.forEach((request) => {
    if (summary[request.status] !== undefined) {
      summary[request.status] += 1;
    }
  });

  holder.innerHTML = `
    <div><span>Approved</span><strong class="text-success">${summary.Approved}</strong></div>
    <div><span>Pending</span><strong class="text-warning">${summary.Pending}</strong></div>
    <div><span>Rejected</span><strong class="text-danger">${summary.Rejected}</strong></div>
  `;
}

function renderStudentInfo(student) {
  document.getElementById("studentInfoCard").innerHTML = `
    <div class="avatar">${getInitials(student.Name)}</div>
    <div>
      <p class="eyebrow">Student Info</p>
      <h2>${student.Name}</h2>
      <p class="muted">ID: ${student.ID}</p>
    </div>
    <div class="marks-grid">
      <div class="mark-box"><span>Math</span><strong>${student.Math}</strong></div>
      <div class="mark-box"><span>Physics</span><strong>${student.Physics}</strong></div>
      <div class="mark-box"><span>Chemistry</span><strong>${student.Chemistry}</strong></div>
      <div class="mark-box"><span>English</span><strong>${student.English}</strong></div>
      <div class="mark-box"><span>CS</span><strong>${student.CS}</strong></div>
    </div>
  `;
}

function renderMarksChart(student) {
  const ctx = document.getElementById("marksChart");
  if (marksChart) marksChart.destroy();
  marksChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: SUBJECTS,
      datasets: [{
        label: "Marks",
        data: SUBJECTS.map((subject) => student[subject]),
        backgroundColor: ["#3b82f6", "#16a34a", "#f59e0b", "#9333ea", "#0891b2"],
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    }
  });
  document.getElementById("averageMarks").textContent = calculateAverage(student).toFixed(1);
}

function renderExtraCurricular(student) {
  const points = clampScore(student.ExtraCurricularPoints);
  const fill = document.getElementById("extraProgress");
  document.getElementById("extraPoints").textContent = `${student.ExtraCurricularPoints}/100`;
  fill.className = `progress-fill ${getProgressClass(points)}`;
  requestAnimationFrame(() => {
    fill.style.width = `${points}%`;
  });
}

function renderBehaviour(student) {
  const points = Number(student.BehaviourPoints) || 0;
  const fill = document.getElementById("behaviourProgress");
  document.getElementById("behaviourPoints").textContent = points;
  document.getElementById("behaviourStatus").textContent = getBehaviourRating(student);
  fill.className = `progress-fill ${getBehaviourClass(points)}`;
  requestAnimationFrame(() => {
    fill.style.width = `${clampScore(points * 4)}%`;
  });
}

function setupPerformanceTabs() {
  document.querySelectorAll(".performance-tabs .tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const active = tab.dataset.tab;
      document.querySelectorAll(".performance-tabs .tab").forEach((button) => {
        const selected = button.dataset.tab === active;
        button.classList.toggle("active", selected);
        button.setAttribute("aria-selected", String(selected));
      });
      document.querySelectorAll(".tab-panel").forEach((panel) => {
        panel.classList.toggle("active", panel.id === `${active}Panel`);
      });
    });
  });
}

function clampScore(value) {
  return Math.max(0, Math.min(Number(value) || 0, 100));
}

function getProgressClass(value) {
  if (value >= 70) return "good";
  if (value >= 40) return "average";
  return "low";
}

function getBehaviourClass(points) {
  const value = Number(points) || 0;
  if (value >= 21) return "success";
  if (value >= 11) return "warning";
  return "danger";
}

function renderRemarks(student) {
  const list = document.getElementById("remarksList");
  const remarks = getRemarks()[student.ID] || [];
  list.innerHTML = remarks.length
    ? remarks.map((remark) => `<div class="list-item"><strong>${remark}</strong></div>`).join("")
    : `<p class="muted">No remarks yet.</p>`;
}

function submitLeave(event, student) {
  event.preventDefault();
  const reasonInput = document.getElementById("leaveReason");
  const reason = reasonInput.value.trim();
  if (!reason) {
    showNotification("Please enter a leave reason.", "error");
    return;
  }

  const requests = getLeaveRequests();
  requests.push({ id: student.ID, reason, status: "Pending", date: todayKey() });
  saveLeaveRequests(requests);
  reasonInput.value = "";
  renderLeaveStatus(student);
  renderLeaveSummary(student);
  showNotification("Leave request submitted.", "success");
}

function renderLeaveStatus(student) {
  const list = document.getElementById("leaveStatusList");
  const requests = getLeaveRequests().filter((request) => request.id === student.ID);
  list.innerHTML = requests.length
    ? requests.map((request) => {
      const statusClass = request.status === "Approved" ? "success" : request.status === "Rejected" ? "danger" : "warning";
      return `<div class="list-item"><strong>${request.reason}</strong><small>${request.date}</small><span class="badge ${statusClass}">${request.status}</span></div>`;
    }).join("")
    : `<p class="muted">No leave applications submitted.</p>`;
}

function renderAttendanceHistory(student) {
  const list = document.getElementById("attendanceHistory");
  const records = getAttendanceRecords();
  const leaveRequests = getLeaveRequests().filter((request) => request.id === student.ID);
  const approvedLeaveDates = new Set(leaveRequests
    .filter((request) => request.status === "Approved")
    .map((request) => request.date));

  const dates = getParentAttendanceDates(student, records, leaveRequests);

  list.innerHTML = dates.length
    ? dates.slice(0, 8).map((date) => {
      const presentNames = records[date] || [];
      const isPresent = presentNames.some((name) => String(name).trim().toLowerCase() === student.Name.toLowerCase());
      const status = isPresent ? "Present" : approvedLeaveDates.has(date) ? "Leave" : "Absent";
      const statusClass = status === "Present" ? "success" : status === "Leave" ? "warning" : "danger";
      const icon = status === "Present" ? "&#10004;" : status === "Leave" ? "&#128993;" : "&#10060;";
      return `<div class="list-item attendance-history-item"><strong>${date}</strong><span class="badge ${statusClass}">${icon} ${status}</span></div>`;
    }).join("")
    : `<p class="muted">No attendance recorded yet.</p>`;
}

window.addEventListener("storage", (event) => {
  if (!activeParentStudent) return;
  if (event.key === "attendanceRecords" || event.key === "completedAttendanceDates" || event.key === "leaveRequests" || event.key === "studentPresentCounts") {
    renderParentDashboard(activeParentStudent);
  }
});
