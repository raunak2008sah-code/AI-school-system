document.addEventListener("DOMContentLoaded", async () => {
  await loadExcel();

  const teacherTab = document.getElementById("teacherTab");
  const parentTab = document.getElementById("parentTab");
  const teacherForm = document.getElementById("teacherForm");
  const parentForm = document.getElementById("parentForm");
  const parentPassword = document.getElementById("parentPassword");
  const toggleParentPassword = document.getElementById("toggleParentPassword");

  teacherTab.addEventListener("click", () => switchTab("teacher"));
  parentTab.addEventListener("click", () => switchTab("parent"));
  toggleParentPassword.addEventListener("click", () => {
    const isHidden = parentPassword.type === "password";
    parentPassword.type = isHidden ? "text" : "password";
    toggleParentPassword.textContent = isHidden ? "Hide" : "Show";
  });

  teacherForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const teacherName = document.getElementById("teacherName").value.trim().replace(/\s+/g, " ");
    if (teacherName.toLowerCase() !== "n. kothiyal") {
      showNotification("Invalid teacher name.", "error");
      return;
    }

    localStorage.setItem("role", "teacher");
    goToTeacher();
  });

  parentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const id = document.getElementById("parentId").value.trim();
    const password = parentPassword.value;
    const student = getStudentById(id);

    if (!student) {
      showNotification("Invalid student ID.", "error");
      return;
    }

    const expectedPassword = window.STUDENT_PASSWORDS?.[student.ID];

    if (!expectedPassword) {
      showNotification("Password is not configured for this student.", "error");
      return;
    }

    if (password !== expectedPassword) {
      showNotification("Invalid password.", "error");
      return;
    }

    localStorage.setItem("role", "parent");
    localStorage.setItem("currentStudentId", student.ID);
    goToParent();
  });

  function switchTab(type) {
    const teacherActive = type === "teacher";
    teacherTab.classList.toggle("active", teacherActive);
    parentTab.classList.toggle("active", !teacherActive);
    teacherForm.classList.toggle("hidden", !teacherActive);
    parentForm.classList.toggle("hidden", teacherActive);
  }
});
