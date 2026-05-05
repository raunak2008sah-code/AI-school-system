function goToLogin() {
  window.location.href = "login.html";
}

function goToTeacher() {
  window.location.href = "teacher.html";
}

function goToParent() {
  window.location.href = "parent.html";
}

function goToAnnouncements(role) {
  const pageName = window.location.pathname.split("/").pop();
  const currentRole = role || (pageName === "teacher.html" ? "teacher" : pageName === "parent.html" ? "parent" : "");

  if (currentRole) {
    localStorage.setItem("announcementRole", currentRole);
    window.location.href = `announcements.html?role=${currentRole}`;
    return;
  }

  window.location.href = "announcements.html";
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function formatTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "ST";
}
