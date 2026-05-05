const MODEL_URL = "model/model.json";
const METADATA_URL = "model/metadata.json";

let model = null;
let webcam = null;
let maxPredictions = 0;
let loopStarted = false;

document.addEventListener("DOMContentLoaded", async () => {
  await loadExcel();
  renderRecentAttendance();
  renderTeacherSidebarOverview();
  updateCompleteAttendanceButton();

  document.getElementById("startAttendance").addEventListener("click", startAttendance);
  document.getElementById("completeAttendance").addEventListener("click", finishAttendance);
});

async function startAttendance() {
  try {
    setStatus("Loading AI model...");
    model = await tmImage.load(MODEL_URL, METADATA_URL);
    maxPredictions = model.getTotalClasses();

    setStatus("Starting webcam...");
    webcam = new tmImage.Webcam(420, 420, true);
    await webcam.setup();
    await webcam.play();

    const container = document.getElementById("webcamContainer");
    container.innerHTML = "";
    container.appendChild(webcam.canvas);

    if (!loopStarted) {
      loopStarted = true;
      window.requestAnimationFrame(loop);
    }

    showNotification("AI attendance started.", "success");
  } catch (error) {
    setStatus("Model or webcam could not start. Check camera permission and the trained Teachable Machine model.");
    showNotification("Unable to start AI model or webcam.", "error");
  }
}

async function loop() {
  if (webcam) {
    webcam.update();
    await predict();
  }
  window.requestAnimationFrame(loop);
}

async function predict() {
  if (!model || !webcam) return;
  const predictions = await model.predict(webcam.canvas);
  const best = predictions
    .slice(0, maxPredictions)
    .sort((a, b) => b.probability - a.probability)[0];

  if (!best) return;

  setDetection(best.className, best.probability);
  updateCurrentPresentCount(best.className);

  if (best.probability > 0.90) {
    const marked = markAttendance(best.className);
    if (marked) {
      updateCurrentPresentCount(best.className);
      setStatus("Attendance Marked");
      renderRecentAttendance();
    }
  } else {
    setStatus("Looking for a confident match...");
  }
}

function setDetection(name, confidence) {
  document.getElementById("detectedName").textContent = name || "Waiting...";
  document.getElementById("confidenceText").textContent = `${Math.round((confidence || 0) * 100)}%`;
}

function updateCurrentPresentCount(name) {
  const student = getStudentByName(name);
  document.getElementById("currentPresentCount").textContent = student ? student.PresentCount : 0;
}

function setStatus(message) {
  document.getElementById("attendanceStatus").textContent = message;
}

function finishAttendance() {
  const counts = completeAttendance();
  setStatus(`Attendance completed. Present: ${counts.present}, Leave: ${counts.leave}, Absent: ${counts.absent}.`);
  renderRecentAttendance();
  renderTeacherSidebarOverview();
  updateCompleteAttendanceButton();
  showNotification("Attendance completed. Remaining students marked absent except approved leave.", "success");
}

function updateCompleteAttendanceButton() {
  const button = document.getElementById("completeAttendance");
  if (!button) return;

  const completed = isAttendanceCompleted();
  button.disabled = completed;
  button.textContent = completed ? "Attendance Completed" : "Complete Attendance";
}

function renderRecentAttendance() {
  const holder = document.getElementById("recentAttendance");
  renderTeacherSidebarOverview();
  const records = getAttendanceRecords();
  const completedDates = getCompletedAttendanceDates();
  const items = Object.entries(records)
    .flatMap(([date, names]) => names.map((name) => ({ name, date })))
    .sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name))
    .slice(0, 8);

  const markedItems = items.map((item) => {
      const student = getStudentByName(item.name);
      const count = student ? student.PresentCount : 0;
      return `<div class="list-item"><strong>${item.name}</strong><small>${item.date}</small><span class="badge success">PresentCount: ${count}</span></div>`;
    }).join("");
  const completedItems = completedDates
    .slice()
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 3)
    .map((date) => `<div class="list-item"><strong>${date}</strong><small>Completed</small><span class="badge warning">Absent finalized</span></div>`)
    .join("");

  holder.innerHTML = markedItems || completedItems
    ? `${completedItems}${markedItems}`
    : `<p class="muted">No attendance records yet.</p>`;
}
