function showNotification(message, type = "info") {
  const root = document.getElementById("toastRoot");
  if (!root) {
    alert(message);
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  root.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("visible"));

  window.setTimeout(() => {
    toast.classList.remove("visible");
    toast.classList.add("dismiss");
    window.setTimeout(() => toast.remove(), 260);
  }, 3000);
}

function getAnnouncements() {
  try {
    return JSON.parse(localStorage.getItem("announcements")) || [];
  } catch {
    return [];
  }
}

function saveAnnouncements(announcements) {
  localStorage.setItem("announcements", JSON.stringify(announcements));
}

function clearStoredAnnouncementsAndRemarks() {
  if (localStorage.getItem("contentCleanupVersion") === "clear-announcements-remarks-v1") return;
  localStorage.removeItem("announcements");
  localStorage.removeItem("announcementsSeenCount");
  localStorage.removeItem("remarks");
  localStorage.setItem("contentCleanupVersion", "clear-announcements-remarks-v1");
}

function getAnnouncementSeenCount() {
  const count = Number(localStorage.getItem("announcementsSeenCount"));
  return Number.isFinite(count) && count > 0 ? count : 0;
}

function getUnreadAnnouncementCount() {
  return Math.max(getAnnouncementCount() - getAnnouncementSeenCount(), 0);
}

function markAnnouncementsSeen() {
  localStorage.setItem("announcementsSeenCount", String(getAnnouncementCount()));
  renderSidebarAnnouncementBadges();
}

function getAnnouncementType(type) {
  return ["urgent", "exam", "general"].includes(type) ? type : "general";
}

function getAnnouncementClass(type) {
  return `${getAnnouncementType(type)}-card`;
}

function getAnnouncementBadge(type) {
  const labels = {
    urgent: "URGENT",
    exam: "EXAM",
    general: "GENERAL"
  };
  return labels[getAnnouncementType(type)];
}

function getAnnouncementIcon(type) {
  const icons = {
    urgent: "&#128308;",
    exam: "&#127919;",
    general: "&#128216;"
  };
  return icons[getAnnouncementType(type)];
}

function getAnnouncementCount() {
  return getAnnouncements().length;
}

function updateText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function renderSidebarAnnouncementBadges() {
  const count = getUnreadAnnouncementCount();
  document.querySelectorAll("[data-announcement-count]").forEach((badge) => {
    badge.textContent = `(${count})`;
    badge.hidden = count === 0;
    badge.setAttribute("aria-label", `${count} unread announcements`);
  });
}

function renderTeacherSidebarOverview() {
  if (typeof getAllStudents !== "function" || typeof getTodayPresentNames !== "function" || typeof getLeaveRequests !== "function") {
    return;
  }

  const counts = typeof getTeacherAttendanceCounts === "function"
    ? getTeacherAttendanceCounts()
    : getSidebarAttendanceCounts();
  const leaveRequests = getLeaveRequests();
  const pendingLeaves = leaveRequests.filter((request) => request.status === "Pending").length;
  const announcements = getAnnouncements();

  updateText("sidebarTotalStudents", counts.total);
  updateText("sidebarPresentToday", counts.present);
  updateText("sidebarPendingLeaves", pendingLeaves);
  updateText("sidebarAttendanceStatus", `${counts.present}/${counts.total}`);
  updateText("sidebarAbsentCount", counts.absent);
  updateText("sidebarAnnouncementCount", announcements.length);
  updateText("sidebarLeaveRequests", leaveRequests.length);
  renderSidebarAnnouncementBadges();
}

function getSidebarAttendanceCounts() {
  const total = getAllStudents().length;
  const present = getTodayPresentNames().length;
  const leave = getLeaveRequests().filter((request) => request.status === "Approved" && request.date === todayKey()).length;
  const finalized = typeof isAttendanceCompleted === "function" && isAttendanceCompleted();

  return {
    total,
    present,
    leave,
    absent: finalized ? Math.max(total - present - leave, 0) : 0
  };
}

function sortAnnouncementsLatestFirst(announcements) {
  const priority = {
    urgent: 1,
    exam: 2,
    general: 3
  };

  return [...announcements].sort((a, b) => {
    const typeOrder = priority[getAnnouncementType(a.type)] - priority[getAnnouncementType(b.type)];
    if (typeOrder !== 0) return typeOrder;
    return String(b.date).localeCompare(String(a.date));
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatAnnouncementDate(date) {
  if (!date) return "No date";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return escapeHtml(date);
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function renderAnnouncementCards(containerId, emptyMessage = "No school updates yet.") {
  const container = document.getElementById(containerId);
  if (!container) return;

  const announcements = sortAnnouncementsLatestFirst(getAnnouncements());
  container.innerHTML = announcements.length
    ? announcements.map((announcement) => {
      const type = getAnnouncementType(announcement.type);
      return `
      <article class="announcement-card ${getAnnouncementClass(type)}">
        <div class="announcement-card-head">
          <div>
            <span class="announcement-badge ${type}-badge">${getAnnouncementBadge(type)}</span>
            <h3><span aria-hidden="true">${getAnnouncementIcon(type)}</span> ${escapeHtml(announcement.title)}</h3>
          </div>
          <time>${formatAnnouncementDate(announcement.date)}</time>
        </div>
        <p>${escapeHtml(announcement.message)}</p>
      </article>
    `;
    }).join("")
    : `<p class="muted">${emptyMessage}</p>`;
}

function applySavedTheme() {
  const saved = localStorage.getItem("theme") || "light";
  document.body.classList.toggle("dark", saved === "dark");
  const toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.textContent = saved === "dark" ? "Light Mode" : "Dark Mode";
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  applySavedTheme();
}

function setupMobileSidebar() {
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar || document.querySelector(".mobile-sidebar-toggle")) return;

  const toggle = document.createElement("button");
  toggle.className = "mobile-sidebar-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-label", "Open menu");
  toggle.setAttribute("aria-expanded", "false");
  toggle.innerHTML = "<span></span><span></span><span></span>";

  const overlay = document.createElement("button");
  overlay.className = "sidebar-overlay";
  overlay.type = "button";
  overlay.setAttribute("aria-label", "Close menu");

  document.body.prepend(toggle);
  document.body.appendChild(overlay);

  const setOpen = (isOpen) => {
    document.body.classList.toggle("sidebar-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  };

  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
    setOpen(!document.body.classList.contains("sidebar-open"));
  });
  overlay.addEventListener("click", () => setOpen(false));
  sidebar.querySelectorAll("a, button").forEach((item) => {
    item.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 760px)").matches) {
        setOpen(false);
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  clearStoredAnnouncementsAndRemarks();
  applySavedTheme();
  setupMobileSidebar();
  renderSidebarAnnouncementBadges();
  const toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.addEventListener("click", toggleTheme);
  }
});

window.addEventListener("storage", (event) => {
  if (event.key === "announcements" || event.key === "announcementsSeenCount") {
    renderSidebarAnnouncementBadges();
    renderTeacherSidebarOverview();
  }
});
