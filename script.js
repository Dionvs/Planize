import { firebaseConfig } from "./firebase-config.js";

let initializeApp;
let addDoc;
let collection;
let deleteDoc;
let getDocs;
let getFirestore;
let onSnapshot;
let orderBy;
let query;
let serverTimestamp;
let setDoc;
let updateDoc;
let doc;
let firebaseModulesPromise;

const DEFAULT_FAMILY_MEMBERS = ["Dion", "Dara"];
const ADD_MEMBER_VALUE = "__add_member__";
const GENERAL_ASSIGNEE = "Algemeen";
const FAMILY_CODE = "1234";
const DEFAULT_ROOMS = ["Keuken", "Badkamer", "Toilet", "Woonkamer", "Slaapkamer", "Algemeen", "Buiten", "Tuin", "Overig"];
const ROOM_SETTINGS_ID = "app-settings-rooms";
const CATEGORIES = ["Dagelijks", "Wekelijks", "Maandelijks", "Seizoensgebonden", "Overig"];
const PRIORITIES = ["Laag", "Normaal", "Hoog"];
const VIEW_FILTERS = ["Actief", "Vandaag", "Te laat", "Deze week", "Voltooid", "Alles"];
const WEEKDAY_LABELS = { 1: "ma", 2: "di", 3: "wo", 4: "do", 5: "vr", 6: "za", 7: "zo" };

const DEFAULT_TASKS = [
  ["Aanrecht schoonmaken", "Keuken", "Dagelijks", 1],
  ["Vaatwasser uitruimen", "Keuken", "Dagelijks", 1],
  ["Stofzuigen woonkamer", "Woonkamer", "Wekelijks", 3],
  ["Toilet schoonmaken", "Toilet", "Wekelijks", 3],
  ["Badkamer schoonmaken", "Badkamer", "Wekelijks", 7],
  ["Dweilen beneden", "Algemeen", "Wekelijks", 7],
  ["Bed verschonen", "Slaapkamer", "Wekelijks", 14],
  ["Ramen binnen wassen", "Algemeen", "Maandelijks", 30],
  ["Koelkast schoonmaken", "Keuken", "Seizoensgebonden", 90],
  ["Oven schoonmaken", "Keuken", "Seizoensgebonden", 90],
  ["Vriezer ontdooien", "Keuken", "Seizoensgebonden", 180],
  ["Ventilatieroosters schoonmaken", "Algemeen", "Seizoensgebonden", 90],
  ["Dakgoot controleren", "Buiten", "Seizoensgebonden", 180],
  ["Tuin opruimen", "Tuin", "Maandelijks", 30]
];

const STORAGE_KEYS = {
  member: "gezinslijst.member",
  customMembers: "gezinslijst.customMembers",
  filters: "gezinslijst.filters",
  notifications: "gezinslijst.notifications",
  familyCodeAccepted: "gezinslijst.familyCodeAccepted"
};

const state = {
  tasks: [],
  rooms: [...DEFAULT_ROOMS],
  filters: loadFilters(),
  currentView: "today",
  notificationsShownForLoad: false
};

let db;
let unsubscribeTasks;

const els = {
  familyGate: document.querySelector("#familyGate"),
  appRoot: document.querySelector("#appRoot"),
  familyCodeForm: document.querySelector("#familyCodeForm"),
  familyCodeInput: document.querySelector("#familyCodeInput"),
  familyCodeError: document.querySelector("#familyCodeError"),
  memberSelect: document.querySelector("#memberSelect"),
  errorBox: document.querySelector("#errorBox"),
  tabCountToday: document.querySelector("#tabCountToday"),
  tabCountWeek: document.querySelector("#tabCountWeek"),
  tabCountFuture: document.querySelector("#tabCountFuture"),
  tabCountManage: document.querySelector("#tabCountManage"),
  tabButtons: document.querySelectorAll(".tab-button"),
  manageFilters: document.querySelector("#manageFilters"),
  manageRoomsButton: document.querySelector("#manageRoomsButton"),
  roomManagerPanel: document.querySelector("#roomManagerPanel"),
  closeRoomManagerButton: document.querySelector("#closeRoomManagerButton"),
  addRoomForm: document.querySelector("#addRoomForm"),
  newRoomInput: document.querySelector("#newRoomInput"),
  roomList: document.querySelector("#roomList"),
  viewTitle: document.querySelector("#viewTitle"),
  openTaskFormButton: document.querySelector("#openTaskFormButton"),
  selectAllTasksWrap: document.querySelector("#selectAllTasksWrap"),
  selectAllTasksCheckbox: document.querySelector("#selectAllTasksCheckbox"),
  bulkDeleteButton: document.querySelector("#bulkDeleteButton"),
  exportTodayButton: document.querySelector("#exportTodayButton"),
  exportWeekButton: document.querySelector("#exportWeekButton"),
  notificationButton: document.querySelector("#notificationButton"),
  logoutFamilyCodeButton: document.querySelector("#logoutFamilyCodeButton"),
  taskFormPanel: document.querySelector("#taskFormPanel"),
  formTitle: document.querySelector("#formTitle"),
  closeFormButton: document.querySelector("#closeFormButton"),
  taskForm: document.querySelector("#taskForm"),
  taskId: document.querySelector("#taskId"),
  taskName: document.querySelector("#taskName"),
  taskType: document.querySelector("#taskType"),
  taskRoom: document.querySelector("#taskRoom"),
  taskCategory: document.querySelector("#taskCategory"),
  taskPriority: document.querySelector("#taskPriority"),
  taskAssignee: document.querySelector("#taskAssignee"),
  recurrenceFields: document.querySelector("#recurrenceFields"),
  taskRepeatUnit: document.querySelector("#taskRepeatUnit"),
  taskRepeatCount: document.querySelector("#taskRepeatCount"),
  repeatUnitLabel: document.querySelector("#repeatUnitLabel"),
  weekdayFields: document.querySelector("#weekdayFields"),
  weekdayInputs: document.querySelectorAll('input[name="weekdays"]'),
  selectAllDaysButton: document.querySelector("#selectAllDaysButton"),
  monthlyHelp: document.querySelector("#monthlyHelp"),
  monthlyFields: document.querySelector("#monthlyFields"),
  taskMonthWeek: document.querySelector("#taskMonthWeek"),
  taskMonthWeekday: document.querySelector("#taskMonthWeekday"),
  taskLastDone: document.querySelector("#taskLastDone"),
  taskDeadline: document.querySelector("#taskDeadline"),
  taskNote: document.querySelector("#taskNote"),
  cancelEditButton: document.querySelector("#cancelEditButton"),
  searchInput: document.querySelector("#searchInput"),
  filterRoom: document.querySelector("#filterRoom"),
  filterCategory: document.querySelector("#filterCategory"),
  filterStatus: document.querySelector("#filterStatus"),
  filterPriority: document.querySelector("#filterPriority"),
  clearFiltersButton: document.querySelector("#clearFiltersButton"),
  syncStatus: document.querySelector("#syncStatus"),
  loadingState: document.querySelector("#loadingState"),
  taskList: document.querySelector("#taskList"),
  emptyState: document.querySelector("#emptyState")
};

init();

function init() {
  refreshMemberSelects();
  syncRoomOptions();
  fillSelect(els.taskCategory, CATEGORIES);
  fillSelect(els.taskPriority, PRIORITIES);
  fillSelect(els.filterCategory, CATEGORIES, true);
  fillSelect(els.filterStatus, VIEW_FILTERS, false);
  fillSelect(els.filterPriority, PRIORITIES, true);

  els.memberSelect.value = localStorage.getItem(STORAGE_KEYS.member) || getFamilyMembers()[0];
  if (!els.memberSelect.value) {
    els.memberSelect.value = getFamilyMembers()[0];
    localStorage.setItem(STORAGE_KEYS.member, els.memberSelect.value);
  }
  hydrateFilters();
  bindEvents();
  resetForm();
  registerServiceWorker();
  if (isFamilyCodeAccepted()) {
    showApp();
  } else {
    showFamilyGate();
  }
}

function bindEvents() {
  els.familyCodeForm.addEventListener("submit", handleFamilyCodeSubmit);
  els.logoutFamilyCodeButton.addEventListener("click", logoutFamilyCode);

  els.memberSelect.addEventListener("change", () => {
    if (els.memberSelect.value === ADD_MEMBER_VALUE) {
      addFamilyMemberFromPrompt();
      return;
    }
    localStorage.setItem(STORAGE_KEYS.member, els.memberSelect.value);
  });

  els.taskAssignee.addEventListener("change", () => {
    if (els.taskAssignee.value === ADD_MEMBER_VALUE) addFamilyMemberFromPrompt(els.taskAssignee);
  });

  els.tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.currentView = button.dataset.view;
      if (state.currentView === "manage") {
        state.filters = { search: "", room: "", category: "", status: "Alles", priority: "" };
        localStorage.setItem(STORAGE_KEYS.filters, JSON.stringify(state.filters));
        hydrateFilters();
      }
      render();
    });
  });

  els.openTaskFormButton.addEventListener("click", () => openForm());
  els.closeFormButton.addEventListener("click", resetForm);
  els.cancelEditButton.addEventListener("click", resetForm);
  els.taskType.addEventListener("change", syncTaskTypeFields);
  els.taskRepeatUnit.addEventListener("change", syncRecurrenceFields);
  els.selectAllDaysButton.addEventListener("click", selectAllWeekdays);
  els.taskForm.addEventListener("submit", saveTask);
  els.manageRoomsButton.addEventListener("click", openRoomManager);
  els.closeRoomManagerButton.addEventListener("click", closeRoomManager);
  els.addRoomForm.addEventListener("submit", addRoom);
  els.roomList.addEventListener("click", handleRoomListClick);
  els.bulkDeleteButton.addEventListener("click", deleteSelectedTasks);
  els.selectAllTasksCheckbox.addEventListener("change", toggleAllVisibleTasks);
  els.exportTodayButton.addEventListener("click", exportTodayIcs);
  els.exportWeekButton.addEventListener("click", exportWeekIcs);
  els.notificationButton.addEventListener("click", requestNotificationPermission);
  els.clearFiltersButton.addEventListener("click", clearFilters);

  [els.searchInput, els.filterRoom, els.filterCategory, els.filterStatus, els.filterPriority].forEach((control) => {
    control.addEventListener("input", () => {
      state.filters = readFiltersFromControls();
      localStorage.setItem(STORAGE_KEYS.filters, JSON.stringify(state.filters));
      render();
    });
  });

  els.taskList.addEventListener("click", handleTaskAction);
  els.taskList.addEventListener("change", handleTaskSelectionChange);
}

function handleFamilyCodeSubmit(event) {
  event.preventDefault();
  if (els.familyCodeInput.value.trim() === FAMILY_CODE) {
    localStorage.setItem(STORAGE_KEYS.familyCodeAccepted, "true");
    els.familyCodeError.classList.add("hidden");
    showApp();
  } else {
    els.familyCodeError.classList.remove("hidden");
  }
}

function logoutFamilyCode() {
  localStorage.removeItem(STORAGE_KEYS.familyCodeAccepted);
  if (unsubscribeTasks) unsubscribeTasks();
  unsubscribeTasks = null;
  state.tasks = [];
  showFamilyGate();
}

function isFamilyCodeAccepted() {
  return localStorage.getItem(STORAGE_KEYS.familyCodeAccepted) === "true";
}

function showApp() {
  els.familyGate.classList.add("hidden");
  els.appRoot.classList.remove("hidden");
  if (!unsubscribeTasks) startFirestore();
}

function showFamilyGate() {
  els.appRoot.classList.add("hidden");
  els.familyGate.classList.remove("hidden");
  els.familyCodeInput.value = "";
  els.familyCodeInput.focus();
}

async function startFirestore() {
  if (firebaseConfig.apiKey.includes("VUL_HIER")) {
    showError("Vul eerst je Firebase-config in firebase-config.js in.");
    els.syncStatus.textContent = "Firebase-config ontbreekt";
    els.loadingState.classList.add("hidden");
    return;
  }

  try {
    await loadFirebaseModules();
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    const taskQuery = query(collection(db, "tasks"), orderBy("volgendeDeadline", "asc"));
    unsubscribeTasks = onSnapshot(
      taskQuery,
      (snapshot) => {
        const documents = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        const roomSettings = documents.find((item) => item.id === ROOM_SETTINGS_ID || item.documentType === "room-settings");
        state.rooms = roomSettings?.ruimtes?.length ? roomSettings.ruimtes : [...DEFAULT_ROOMS];
        state.tasks = documents.filter((item) => item.id !== ROOM_SETTINGS_ID && item.documentType !== "room-settings");
        syncRoomOptions();
        renderRoomList();
        state.notificationsShownForLoad = false;
        els.syncStatus.textContent = "Realtime verbonden";
        hideError();
        render();
      },
      (error) => {
        console.error(error);
        els.syncStatus.textContent = "Firestore niet bereikbaar";
        showError("Firestore is niet bereikbaar. Controleer je internetverbinding, Firebase-config en security rules.");
      }
    );
  } catch (error) {
    console.error(error);
    showError("Firestore starten mislukt. Controleer firebase-config.js.");
  }
}

function loadFirebaseModules() {
  if (!firebaseModulesPromise) {
    firebaseModulesPromise = Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js")
    ]).then(([appModule, firestoreModule]) => {
      initializeApp = appModule.initializeApp;
      ({
        addDoc,
        collection,
        deleteDoc,
        getDocs,
        getFirestore,
        onSnapshot,
        orderBy,
        query,
        serverTimestamp,
        setDoc,
        updateDoc,
        doc
      } = firestoreModule);
    });
  }
  return firebaseModulesPromise;
}

function render() {
  const decorated = state.tasks.map(normalizeTask);
  const filtered = getTasksForCurrentView(decorated).sort(sortTasks);
  const counts = getCounts(decorated);

  els.loadingState.classList.add("hidden");

  syncViewChrome(counts);
  renderTasks(filtered);
  maybeShowBrowserNotifications(counts);
}

function renderTasks(tasks) {
  els.taskList.innerHTML = "";
  els.emptyState.classList.toggle("hidden", tasks.length > 0);

  const fragment = document.createDocumentFragment();
  tasks.forEach((task) => {
    try {
      fragment.appendChild(createTaskCard(task));
    } catch (error) {
      console.error("Taakkaart renderen mislukt", task, error);
      fragment.appendChild(createFallbackTaskCard(task));
    }
  });
  els.taskList.appendChild(fragment);
  updateBulkDeleteLabel();
}

function createTaskCard(task) {
  const card = document.createElement("article");
  card.className = `task-card ${state.currentView === "manage" ? "task-card-manage" : "task-card-planning"} ${statusClass(task.status)}`;
  card.dataset.id = task.id;
  const noteHtml = task.notitie ? `<div class="task-note">${escapeHtml(task.notitie)}</div>` : "";
  const planningActions = `
    ${task.voltooid ? "" : '<button class="button button-primary" type="button" data-action="done">Gedaan</button>'}
    <button class="button" type="button" data-action="calendar">Zet in Google Calendar</button>
  `;
  const manageActions = `
    <button class="button" type="button" data-action="edit">Bewerken</button>
    <button class="button" type="button" data-action="calendar">Zet in Google Calendar</button>
  `;
  const selectionHtml = state.currentView === "manage"
    ? `<label class="select-task"><input type="checkbox" class="task-select" value="${escapeHtml(task.id)}"> Selecteer</label>`
    : "";
  card.innerHTML = `
    ${selectionHtml}
    <div class="task-title">
      <h3>${escapeHtml(task.naam || "Naamloze taak")}</h3>
      <div class="pill-row">
        <span class="pill">${task.type === "eenmalig" ? "Eenmalig" : "Terugkerend"}</span>
        <span class="pill">${escapeHtml(task.toegewezenAan || GENERAL_ASSIGNEE)}</span>
        <span class="pill">${escapeHtml(task.ruimte || "Overig")}</span>
        <span class="pill">${escapeHtml(task.categorie || "Overig")}</span>
        <span class="pill pill-priority-${slug(task.prioriteit || "Normaal")}">${escapeHtml(task.prioriteit || "Normaal")}</span>
        <span class="pill status-label">${task.status}</span>
      </div>
    </div>
    ${field("Laatst gedaan", formatDate(task.laatstGedaan))}
    ${field("Deadline", formatDate(task.volgendeDeadline))}
    ${field("Herhaalperiode", task.type === "eenmalig" ? "Eenmalig" : recurrenceLabel(task))}
    ${field("Voor wie", task.toegewezenAan || GENERAL_ASSIGNEE)}
    ${field("Type", task.type === "eenmalig" ? "Eenmalig" : "Terugkerend")}
    <div class="task-actions">
      ${state.currentView === "manage" ? manageActions : planningActions}
    </div>
    ${noteHtml}
  `;
  return card;
}

function createFallbackTaskCard(task) {
  const card = document.createElement("article");
  card.className = "task-card";
  card.dataset.id = task.id || "";
  card.innerHTML = `
    <div class="task-title">
      <h3>${escapeHtml(task.naam || "Taak")}</h3>
      <div class="pill-row"><span class="pill">Taak geladen</span></div>
    </div>
    <div class="task-actions">
      <button class="button button-primary" type="button" data-action="done">Gedaan</button>
    </div>
  `;
  return card;
}

function syncViewChrome(counts) {
  const titles = {
    today: "Vandaag",
    week: "Deze week",
    future: "Toekomstig",
    manage: "Taken lijst"
  };
  els.viewTitle.textContent = titles[state.currentView];
  els.tabCountToday.textContent = `(${counts.today})`;
  els.tabCountWeek.textContent = `(${counts.week})`;
  els.tabCountFuture.textContent = `(${counts.future})`;
  els.tabCountManage.textContent = `(${counts.manage})`;
  els.tabButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.view === state.currentView));
  els.manageFilters.classList.toggle("hidden", state.currentView !== "manage");
  els.openTaskFormButton.classList.toggle("hidden", state.currentView !== "manage");
  els.manageRoomsButton.classList.toggle("hidden", state.currentView !== "manage");
  els.selectAllTasksWrap.classList.toggle("hidden", state.currentView !== "manage");
  els.bulkDeleteButton.classList.toggle("hidden", state.currentView !== "manage");
  els.exportTodayButton.classList.toggle("hidden", state.currentView !== "today");
  els.exportWeekButton.classList.toggle("hidden", state.currentView !== "week");
}

function getTasksForCurrentView(tasks) {
  const openTasks = tasks.filter((task) => task.actief !== false && !task.voltooid);
  const today = todayIso();
  const sunday = endOfCurrentWeekIso();
  if (state.currentView === "today") return openTasks.filter((task) => task.status === "Te laat" || task.status === "Vandaag");
  if (state.currentView === "week") return openTasks.filter((task) => task.volgendeDeadline > today && task.volgendeDeadline <= sunday);
  if (state.currentView === "future") return openTasks.filter((task) => task.volgendeDeadline > sunday);
  return tasks.filter(matchesFilters);
}

function field(label, value) {
  return `<div class="field-label">${label}<span class="field-value">${escapeHtml(value || "-")}</span></div>`;
}

async function saveTask(event) {
  event.preventDefault();
  const id = els.taskId.value;
  const payload = readTaskForm();
  if (!payload) return;

  try {
    if (id) {
      const existingTask = state.tasks.find((task) => task.id === id);
      const completionPatch = payload.type === "terugkerend" || existingTask?.type !== "eenmalig" ? { voltooid: false } : {};
      await updateDoc(doc(db, "tasks", id), {
        ...payload,
        ...completionPatch,
        laatstAangepastOp: serverTimestamp(),
        laatstAangepastDoor: selectedMember()
      });
    } else {
      await addDoc(collection(db, "tasks"), {
        ...payload,
        voltooid: false,
        aangemaaktOp: serverTimestamp(),
        laatstAangepastOp: serverTimestamp(),
        laatstAangepastDoor: selectedMember(),
        actief: true
      });
    }
    resetForm();
  } catch (error) {
    console.error(error);
    showError(id ? "Taak wijzigen mislukt." : "Taak toevoegen mislukt.");
  }
}

function readTaskForm() {
  const type = els.taskType.value;
  const herhaling = type === "terugkerend" ? readRecurrenceForm() : null;
  if (type === "terugkerend" && !herhaling) return null;

  return {
    type,
    naam: els.taskName.value.trim(),
    ruimte: els.taskRoom.value,
    categorie: els.taskCategory.value,
    prioriteit: els.taskPriority.value,
    toegewezenAan: els.taskAssignee.value || GENERAL_ASSIGNEE,
    herhaling,
    intervalDagen: type === "terugkerend" ? recurrenceToLegacyDays(herhaling) : null,
    laatstGedaan: els.taskLastDone.value || "",
    volgendeDeadline: els.taskDeadline.value,
    notitie: els.taskNote.value.trim()
  };
}

async function handleTaskAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const card = button.closest(".task-card");
  const task = state.tasks.find((item) => item.id === card.dataset.id);
  if (!task) return;

  const action = button.dataset.action;
  if (action === "done") await markDone(task);
  if (action === "edit") openForm(task);
  if (action === "delete") await softDeleteTask(task);
  if (action === "calendar") openGoogleCalendar(task);
}

async function markDone(task) {
  const today = todayIso();
  try {
    const update = task.type === "eenmalig"
      ? {
          laatstGedaan: today,
          voltooid: true,
          laatstAangepastOp: serverTimestamp(),
          laatstAangepastDoor: selectedMember()
        }
      : {
          laatstGedaan: today,
          volgendeDeadline: calculateNextDeadline(normalizeTask(task), today),
          voltooid: false,
          laatstAangepastOp: serverTimestamp(),
          laatstAangepastDoor: selectedMember()
        };
    await updateDoc(doc(db, "tasks", task.id), update);
  } catch (error) {
    console.error(error);
    showError("Taak afvinken mislukt.");
  }
}

async function softDeleteTask(task) {
  if (!confirm(`Weet je zeker dat je "${task.naam}" definitief wilt verwijderen?`)) return;
  try {
    await deleteDoc(doc(db, "tasks", task.id));
  } catch (error) {
    console.error(error);
    showError("Taak definitief verwijderen mislukt.");
  }
}

function handleTaskSelectionChange(event) {
  if (!event.target.classList.contains("task-select")) return;
  updateBulkDeleteLabel();
}

function toggleAllVisibleTasks() {
  els.taskList.querySelectorAll(".task-select").forEach((input) => {
    input.checked = els.selectAllTasksCheckbox.checked;
  });
  updateBulkDeleteLabel();
}

async function deleteSelectedTasks() {
  const selectedIds = [...els.taskList.querySelectorAll(".task-select:checked")].map((input) => input.value);
  if (selectedIds.length === 0) {
    showError("Selecteer eerst een of meer taken in de takenlijst.");
    return;
  }

  if (!confirm(`Weet je zeker dat je ${selectedIds.length} geselecteerde taken definitief wilt verwijderen?`)) return;

  try {
    await Promise.all(selectedIds.map((id) => deleteDoc(doc(db, "tasks", id))));
    hideError();
  } catch (error) {
    console.error(error);
    showError("Geselecteerde taken verwijderen mislukt.");
  }
}

function updateBulkDeleteLabel() {
  const allInputs = [...els.taskList.querySelectorAll(".task-select")];
  const selectedCount = allInputs.filter((input) => input.checked).length;
  els.bulkDeleteButton.textContent = selectedCount > 0
    ? `Geselecteerde verwijderen (${selectedCount})`
    : "Geselecteerde verwijderen";
  els.selectAllTasksCheckbox.checked = allInputs.length > 0 && selectedCount === allInputs.length;
  els.selectAllTasksCheckbox.indeterminate = selectedCount > 0 && selectedCount < allInputs.length;
}

async function addDefaultTasks() {
  try {
    const existingSnapshot = await getDocs(collection(db, "tasks"));
    const existingKeys = new Set(
      existingSnapshot.docs
        .map((item) => item.data())
        .filter((task) => task.actief !== false)
        .map((task) => duplicateKey(task.naam, task.ruimte))
    );

    const today = todayIso();
    const additions = DEFAULT_TASKS.filter(([name, room]) => !existingKeys.has(duplicateKey(name, room)));
    await Promise.all(
      additions.map(([naam, ruimte, categorie, intervalDagen]) =>
        addDoc(collection(db, "tasks"), {
          naam,
          type: "terugkerend",
          ruimte,
          categorie,
          prioriteit: "Normaal",
          toegewezenAan: GENERAL_ASSIGNEE,
          intervalDagen,
          laatstGedaan: "",
          volgendeDeadline: today,
          notitie: "",
          voltooid: false,
          aangemaaktOp: serverTimestamp(),
          laatstAangepastOp: serverTimestamp(),
          laatstAangepastDoor: selectedMember(),
          actief: true
        })
      )
    );

    if (additions.length === 0) {
      showError("Alle standaardtaken staan al in de lijst.");
    } else {
      hideError();
    }
  } catch (error) {
    console.error(error);
    showError("Standaardtaken toevoegen mislukt.");
  }
}

function openForm(task) {
  els.taskFormPanel.classList.remove("hidden");
  els.formTitle.textContent = task ? "Taak bewerken" : "Nieuwe taak";

  if (!task) {
    resetForm(false);
    return;
  }

  els.taskId.value = task.id;
  els.taskName.value = task.naam || "";
  els.taskType.value = task.type || "terugkerend";
  els.taskRoom.value = task.ruimte || "Overig";
  els.taskCategory.value = task.categorie || "Overig";
  els.taskPriority.value = task.prioriteit || "Normaal";
  els.taskAssignee.value = task.toegewezenAan || GENERAL_ASSIGNEE;
  els.taskLastDone.value = task.laatstGedaan || "";
  els.taskDeadline.value = task.volgendeDeadline || todayIso();
  els.taskNote.value = task.notitie || "";
  setRecurrenceForm(normalizeTask(task).herhaling);
  syncTaskTypeFields();
  els.taskName.focus();
}

function resetForm(hide = true) {
  els.taskForm.reset();
  els.taskId.value = "";
  els.formTitle.textContent = "Nieuwe taak";
  els.taskType.value = "terugkerend";
  els.taskRoom.value = state.rooms.includes("Algemeen") ? "Algemeen" : state.rooms[0];
  els.taskCategory.value = "Wekelijks";
  els.taskPriority.value = "Normaal";
  els.taskAssignee.value = GENERAL_ASSIGNEE;
  els.taskRepeatUnit.value = "week";
  els.taskRepeatCount.value = "1";
  els.taskDeadline.value = todayIso();
  els.taskNote.value = "";
  setSelectedWeekdays([isoWeekday(parseIsoDate(todayIso()))]);
  syncTaskTypeFields();
  if (hide) els.taskFormPanel.classList.add("hidden");
}

function openGoogleCalendar(task) {
  try {
    const date = parseIsoDate(task.volgendeDeadline);
    const nextDate = new Date(date);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    const dates = `${toCompactDate(date)}/${toCompactDate(nextDate)}`;
    const details = buildCalendarDescription(task);
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: `Schoonmaak: ${task.naam}`,
      dates,
      details
    });
    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, "_blank");
  } catch (error) {
    console.error(error);
    showError("Agenda-export mislukt.");
  }
}

function exportTodayIcs() {
  try {
    const today = todayIso();
    const tasks = state.tasks
      .filter((task) => task.actief !== false)
      .map(normalizeTask)
      .filter((task) => !task.voltooid)
      .filter((task) => task.volgendeDeadline <= today)
      .sort(sortTasks);

    downloadIcs(tasks, `poproute-57-vandaag-${today}.ics`, "Er zijn geen taken voor vandaag om te exporteren.");
  } catch (error) {
    console.error(error);
    showError("Agenda-export mislukt.");
  }
}

function exportWeekIcs() {
  try {
    const today = todayIso();
    const sunday = endOfCurrentWeekIso();
    const tasks = state.tasks
      .filter((task) => task.actief !== false)
      .map(normalizeTask)
      .filter((task) => !task.voltooid)
      .filter((task) => task.volgendeDeadline >= today && task.volgendeDeadline <= sunday)
      .sort(sortTasks);

    downloadIcs(tasks, `poproute-57-deze-week-${today}.ics`, "Er zijn geen taken voor deze week om te exporteren.");
  } catch (error) {
    console.error(error);
    showError("Agenda-export mislukt.");
  }
}

function downloadIcs(tasks, filename, emptyMessage) {
  if (tasks.length === 0) {
    showError(emptyMessage);
    return;
  }

  const nowStamp = formatIcsDateTime(new Date());
  const events = tasks.map((task) => {
    const start = parseIsoDate(task.volgendeDeadline);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return [
      "BEGIN:VEVENT",
      `UID:${task.id}-${task.volgendeDeadline}@poproute-57`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART;VALUE=DATE:${toCompactDate(start)}`,
      `DTEND;VALUE=DATE:${toCompactDate(end)}`,
      `SUMMARY:${escapeIcs(`Schoonmaak: ${task.naam}`)}`,
      `DESCRIPTION:${escapeIcs(buildCalendarDescription(task))}`,
      "END:VEVENT"
    ].join("\r\n");
  });

  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Poproute 57//Schoonmaak//NL", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR"].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  hideError();
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    showError("Browsermeldingen worden niet ondersteund op dit apparaat.");
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    localStorage.setItem(STORAGE_KEYS.notifications, "true");
    els.notificationButton.textContent = "Meldingen toegestaan";
    state.notificationsShownForLoad = false;
    render();
  } else {
    localStorage.setItem(STORAGE_KEYS.notifications, "false");
    showError("Notificatietoestemming geweigerd.");
  }
}

function maybeShowBrowserNotifications(counts) {
  const enabled = localStorage.getItem(STORAGE_KEYS.notifications) === "true";
  if (!enabled || state.notificationsShownForLoad || !("Notification" in window) || Notification.permission !== "granted") return;
  if (counts.today > 0) new Notification(`Schoonmaaklijst: ${counts.today} taken vandaag`);
  if (counts.overdue > 0) new Notification(`Schoonmaaklijst: ${counts.overdue} taken te laat`);
  state.notificationsShownForLoad = true;
}

function getCounts(tasks) {
  const openTasks = tasks.filter((task) => task.actief !== false && !task.voltooid);
  const today = todayIso();
  const sunday = endOfCurrentWeekIso();
  return {
    today: openTasks.filter((task) => task.status === "Te laat" || task.status === "Vandaag").length,
    overdue: openTasks.filter((task) => task.status === "Te laat").length,
    week: openTasks.filter((task) => task.volgendeDeadline > today && task.volgendeDeadline <= sunday).length,
    future: openTasks.filter((task) => task.volgendeDeadline > sunday).length,
    manage: tasks.length,
    total: openTasks.length,
    oneTimeToday: openTasks.filter((task) => task.status === "Vandaag" && task.type === "eenmalig").length,
    recurringToday: openTasks.filter((task) => task.status === "Vandaag" && task.type === "terugkerend").length,
    completed: tasks.filter((task) => task.voltooid).length
  };
}

function matchesFilters(task) {
  const search = state.filters.search.trim().toLowerCase();
  const view = state.filters.status || "Actief";
  const inThisWeek = ["Te laat", "Vandaag", "Binnenkort"].includes(task.status);
  const viewMatches =
    view === "Alles" ||
    (view === "Actief" && !task.voltooid) ||
    (view === "Voltooid" && task.voltooid) ||
    (view === "Deze week" && !task.voltooid && inThisWeek) ||
    (!task.voltooid && task.status === view);

  return (
    viewMatches &&
    (!search || String(task.naam || "").toLowerCase().includes(search)) &&
    (!state.filters.room || task.ruimte === state.filters.room) &&
    (!state.filters.category || task.categorie === state.filters.category) &&
    (!state.filters.priority || task.prioriteit === state.filters.priority)
  );
}

function sortTasks(a, b) {
  const priority = { "Te laat": 0, Vandaag: 1, Binnenkort: 2, "Op schema": 3, Voltooid: 4 };
  const statusDiff = priority[a.status] - priority[b.status];
  if (statusDiff !== 0) return statusDiff;
  return String(a.volgendeDeadline || "").localeCompare(String(b.volgendeDeadline || ""));
}

function normalizeTask(task) {
  const type = task.type === "eenmalig" ? "eenmalig" : "terugkerend";
  const voltooid = Boolean(task.voltooid);
  const herhaling = normalizeRecurrence(task);
  return {
    ...task,
    type,
    voltooid,
    notitie: task.notitie || "",
    toegewezenAan: task.toegewezenAan || GENERAL_ASSIGNEE,
    herhaling,
    status: voltooid ? "Voltooid" : getStatus(task.volgendeDeadline)
  };
}

function getStatus(deadlineIso) {
  if (!deadlineIso) return "Op schema";
  const today = todayIso();
  if (deadlineIso < today) return "Te laat";
  if (deadlineIso === today) return "Vandaag";
  if (deadlineIso <= addDays(today, 7)) return "Binnenkort";
  return "Op schema";
}

function todayIso() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");
}

function addDays(isoDate, days) {
  const date = parseIsoDate(isoDate);
  date.setUTCDate(date.getUTCDate() + Number(days));
  return toIsoDate(date);
}

function endOfCurrentWeekIso(referenceIso = todayIso()) {
  const date = parseIsoDate(referenceIso);
  const weekday = isoWeekday(date);
  return addDays(referenceIso, 7 - weekday);
}

function isoWeekday(date) {
  return date.getUTCDay() === 0 ? 7 : date.getUTCDay();
}

function normalizeRecurrence(task) {
  if (task.herhaling?.eenheid === "week") {
    return {
      eenheid: "week",
      aantal: Math.max(1, Number(task.herhaling.aantal) || 1),
      weekdagen: [...new Set((task.herhaling.weekdagen || []).map(Number))].filter((day) => day >= 1 && day <= 7).sort()
    };
  }
  if (task.herhaling?.eenheid === "maand") {
    const deadlineDate = parseIsoDate(task.volgendeDeadline || todayIso());
    return {
      eenheid: "maand",
      aantal: Math.max(1, Number(task.herhaling.aantal) || 1),
      weekVanMaand: task.herhaling.weekVanMaand || weekOfMonthForDate(deadlineDate),
      weekdag: Number(task.herhaling.weekdag) || isoWeekday(deadlineDate)
    };
  }

  const legacyDays = Math.max(1, Number(task.intervalDagen) || 7);
  if (legacyDays === 30 || legacyDays >= 60) {
    const deadlineDate = parseIsoDate(task.volgendeDeadline || todayIso());
    return {
      eenheid: "maand",
      aantal: legacyDays >= 365 ? 12 : Math.max(1, Math.round(legacyDays / 30)),
      weekVanMaand: weekOfMonthForDate(deadlineDate),
      weekdag: isoWeekday(deadlineDate)
    };
  }
  if (legacyDays === 1) return { eenheid: "week", aantal: 1, weekdagen: [1, 2, 3, 4, 5, 6, 7] };
  return {
    eenheid: "week",
    aantal: Math.max(1, Math.round(legacyDays / 7)),
    weekdagen: [isoWeekday(parseIsoDate(task.volgendeDeadline || todayIso()))]
  };
}

function recurrenceToLegacyDays(recurrence) {
  if (recurrence.eenheid === "maand") return recurrence.aantal * 30;
  if (recurrence.aantal === 1 && recurrence.weekdagen.length === 7) return 1;
  return recurrence.aantal * 7;
}

function recurrenceLabel(task) {
  const recurrence = task.herhaling || normalizeRecurrence(task);
  if (recurrence.eenheid === "maand") {
    const weekText = monthWeekLabel(recurrence.weekVanMaand);
    const dayText = WEEKDAY_LABELS[recurrence.weekdag];
    if (recurrence.aantal === 1) return `Maandelijks in de ${weekText} week op ${dayText}`;
    if (recurrence.aantal === 12) return `Jaarlijks in de ${weekText} week op ${dayText}`;
    return `Elke ${recurrence.aantal} maanden in de ${weekText} week op ${dayText}`;
  }
  const days = recurrence.weekdagen || [];
  if (recurrence.aantal === 1 && days.length === 7) return "Dagelijks";
  const dayText = days.map((day) => WEEKDAY_LABELS[day]).join(" en ");
  return recurrence.aantal === 1 ? `Wekelijks op ${dayText}` : `Elke ${recurrence.aantal} weken op ${dayText}`;
}

function calculateNextDeadline(task, completedOnIso) {
  const recurrence = task.herhaling || normalizeRecurrence(task);
  if (recurrence.eenheid === "maand") {
    return monthlyOccurrenceAfter(completedOnIso, recurrence);
  }

  const selectedDays = recurrence.weekdagen?.length ? recurrence.weekdagen : [isoWeekday(parseIsoDate(completedOnIso))];
  const currentDay = isoWeekday(parseIsoDate(completedOnIso));
  const laterThisWeek = selectedDays.find((day) => day > currentDay);
  if (laterThisWeek) return addDays(completedOnIso, laterThisWeek - currentDay);
  return addDays(completedOnIso, recurrence.aantal * 7 - currentDay + selectedDays[0]);
}

function monthlyOccurrenceAfter(isoDate, recurrence) {
  const source = parseIsoDate(isoDate);
  const targetMonth = new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth() + Number(recurrence.aantal), 1));
  return nthWeekdayOfMonth(targetMonth.getUTCFullYear(), targetMonth.getUTCMonth(), recurrence.weekdag, recurrence.weekVanMaand);
}

function nthWeekdayOfMonth(year, monthIndex, weekday, weekOfMonth) {
  if (String(weekOfMonth) === "last") {
    const last = new Date(Date.UTC(year, monthIndex + 1, 0));
    const offset = (isoWeekday(last) - Number(weekday) + 7) % 7;
    last.setUTCDate(last.getUTCDate() - offset);
    return toIsoDate(last);
  }
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const offset = (Number(weekday) - isoWeekday(first) + 7) % 7;
  const requestedDate = 1 + offset + (Number(weekOfMonth) - 1) * 7;
  const candidate = new Date(Date.UTC(year, monthIndex, requestedDate));
  if (candidate.getUTCMonth() !== monthIndex) return nthWeekdayOfMonth(year, monthIndex, weekday, "last");
  return toIsoDate(candidate);
}

function weekOfMonthForDate(date) {
  const day = date.getUTCDate();
  const nextWeek = day + 7;
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  return nextWeek > lastDay ? "last" : String(Math.ceil(day / 7));
}

function monthWeekLabel(value) {
  return { 1: "eerste", 2: "tweede", 3: "derde", 4: "vierde", last: "laatste" }[String(value)] || "eerste";
}

function parseIsoDate(isoDate) {
  const [year, month, day] = String(isoDate).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toIsoDate(date) {
  const year = date.getUTCFullYear ? date.getUTCFullYear() : date.getFullYear();
  const month = String((date.getUTCMonth ? date.getUTCMonth() : date.getMonth()) + 1).padStart(2, "0");
  const day = String(date.getUTCDate ? date.getUTCDate() : date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toCompactDate(date) {
  return toIsoDate(date).replaceAll("-", "");
}

function formatDate(value) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  return `${day}-${month}-${year}`;
}

function buildCalendarDescription(task) {
  return [
    `Type: ${task.type === "eenmalig" ? "Eenmalig" : "Terugkerend"}`,
    `Ruimte: ${task.ruimte || "-"}`,
    `Voor wie: ${task.toegewezenAan || GENERAL_ASSIGNEE}`,
    `Categorie: ${task.categorie || "-"}`,
    `Prioriteit: ${task.prioriteit || "-"}`,
    `Herhaalperiode: ${task.type === "eenmalig" ? "Eenmalig" : recurrenceLabel(normalizeTask(task))}`,
    `Laatst gedaan: ${formatDate(task.laatstGedaan)}`,
    `Laatst aangepast door: ${task.laatstAangepastDoor || "-"}`,
    `Notitie: ${task.notitie || "-"}`
  ].join("\n");
}

function formatIcsDateTime(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcs(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function syncTaskTypeFields() {
  const isRecurring = els.taskType.value === "terugkerend";
  els.recurrenceFields.classList.toggle("hidden", !isRecurring);
  syncRecurrenceFields();
}

function syncRecurrenceFields() {
  const isWeekly = els.taskRepeatUnit.value === "week";
  els.weekdayFields.classList.toggle("hidden", !isWeekly);
  els.monthlyFields.classList.toggle("hidden", isWeekly);
  els.monthlyHelp.classList.toggle("hidden", isWeekly);
  els.repeatUnitLabel.textContent = isWeekly ? "week/weken" : "maand/maanden";
  els.taskRepeatCount.max = isWeekly ? "52" : "120";
}

function selectAllWeekdays() {
  setSelectedWeekdays([1, 2, 3, 4, 5, 6, 7]);
}

function selectedWeekdays() {
  return [...els.weekdayInputs].filter((input) => input.checked).map((input) => Number(input.value));
}

function setSelectedWeekdays(days) {
  els.weekdayInputs.forEach((input) => {
    input.checked = days.includes(Number(input.value));
  });
}

function readRecurrenceForm() {
  const unit = els.taskRepeatUnit.value;
  const count = Math.max(1, Number(els.taskRepeatCount.value) || 1);
  if (unit === "week") {
    const weekdays = selectedWeekdays();
    if (weekdays.length === 0) {
      showError("Kies minimaal een dag van de week.");
      return null;
    }
    return { eenheid: "week", aantal: count, weekdagen: weekdays };
  }

  return {
    eenheid: "maand",
    aantal: count,
    weekVanMaand: els.taskMonthWeek.value,
    weekdag: Number(els.taskMonthWeekday.value) || 1
  };
}

function setRecurrenceForm(recurrence) {
  const normalized = recurrence || { eenheid: "week", aantal: 1, weekdagen: [isoWeekday(parseIsoDate(todayIso()))] };
  els.taskRepeatUnit.value = normalized.eenheid === "maand" ? "month" : "week";
  els.taskRepeatCount.value = String(normalized.aantal || 1);
  setSelectedWeekdays(normalized.weekdagen || [isoWeekday(parseIsoDate(els.taskDeadline.value || todayIso()))]);
  els.taskMonthWeek.value = String(normalized.weekVanMaand || weekOfMonthForDate(parseIsoDate(els.taskDeadline.value || todayIso())));
  els.taskMonthWeekday.value = String(normalized.weekdag || isoWeekday(parseIsoDate(els.taskDeadline.value || todayIso())));
  syncRecurrenceFields();
}

function fillSelect(select, options, includeAll = false, values = options) {
  select.innerHTML = "";
  if (includeAll) select.appendChild(new Option("Alle", ""));
  options.forEach((label, index) => select.appendChild(new Option(label, values[index])));
}

function syncRoomOptions(preferredRoom = els.taskRoom?.value) {
  const rooms = [...new Set((state.rooms || DEFAULT_ROOMS).map((room) => String(room).trim()).filter(Boolean))];
  state.rooms = rooms.length ? rooms : [...DEFAULT_ROOMS];
  fillSelect(els.taskRoom, state.rooms);
  fillSelect(els.filterRoom, state.rooms, true);
  els.taskRoom.value = state.rooms.includes(preferredRoom) ? preferredRoom : (state.rooms.includes("Algemeen") ? "Algemeen" : state.rooms[0]);
  if (state.rooms.includes(state.filters.room)) els.filterRoom.value = state.filters.room;
}

function openRoomManager() {
  els.roomManagerPanel.classList.remove("hidden");
  renderRoomList();
  els.newRoomInput.focus();
}

function closeRoomManager() {
  els.roomManagerPanel.classList.add("hidden");
  els.addRoomForm.reset();
}

async function addRoom(event) {
  event.preventDefault();
  const room = els.newRoomInput.value.trim();
  if (!room) return;
  if (state.rooms.some((existing) => existing.toLowerCase() === room.toLowerCase())) {
    showError("Deze ruimte bestaat al.");
    return;
  }
  await saveRooms([...state.rooms, room]);
  els.addRoomForm.reset();
}

async function handleRoomListClick(event) {
  const button = event.target.closest("button[data-room]");
  if (!button) return;
  const room = button.dataset.room;
  const usageCount = state.tasks.filter((task) => task.ruimte === room).length;
  if (usageCount > 0) {
    showError(`De ruimte "${room}" wordt nog gebruikt door ${usageCount} taken. Wijzig of verwijder die taken eerst.`);
    return;
  }
  if (!confirm(`Ruimte "${room}" verwijderen?`)) return;
  await saveRooms(state.rooms.filter((item) => item !== room));
}

async function saveRooms(rooms) {
  if (!db || !setDoc) {
    showError("Firestore is nog niet verbonden.");
    return;
  }
  try {
    await setDoc(doc(db, "tasks", ROOM_SETTINGS_ID), {
      documentType: "room-settings",
      ruimtes: rooms,
      actief: false,
      volgendeDeadline: "9999-12-31",
      laatstAangepastOp: serverTimestamp(),
      laatstAangepastDoor: selectedMember()
    });
    hideError();
  } catch (error) {
    console.error(error);
    showError("Ruimtes opslaan mislukt.");
  }
}

function renderRoomList() {
  els.roomList.innerHTML = "";
  state.rooms.forEach((room) => {
    const row = document.createElement("div");
    row.className = "room-row";
    const usageCount = state.tasks.filter((task) => task.ruimte === room).length;
    row.innerHTML = `<span><strong>${escapeHtml(room)}</strong><small>${usageCount} taken</small></span><button class="icon-button" type="button" data-room="${escapeHtml(room)}" aria-label="${escapeHtml(room)} verwijderen">x</button>`;
    els.roomList.appendChild(row);
  });
}

function refreshMemberSelects(selectedAssignee = els.taskAssignee?.value || GENERAL_ASSIGNEE) {
  const members = getFamilyMembers();
  fillSelect(els.memberSelect, [...members, "Gezinslid toevoegen..."], false, [...members, ADD_MEMBER_VALUE]);
  fillSelect(els.taskAssignee, [GENERAL_ASSIGNEE, ...members, "Gezinslid toevoegen..."], false, [GENERAL_ASSIGNEE, ...members, ADD_MEMBER_VALUE]);
  if (members.includes(localStorage.getItem(STORAGE_KEYS.member))) {
    els.memberSelect.value = localStorage.getItem(STORAGE_KEYS.member);
  }
  els.taskAssignee.value = [GENERAL_ASSIGNEE, ...members].includes(selectedAssignee) ? selectedAssignee : GENERAL_ASSIGNEE;
}

function getFamilyMembers() {
  try {
    const customMembers = JSON.parse(localStorage.getItem(STORAGE_KEYS.customMembers) || "[]");
    return [...new Set([...DEFAULT_FAMILY_MEMBERS, ...customMembers].filter(Boolean))];
  } catch {
    return DEFAULT_FAMILY_MEMBERS;
  }
}

function addFamilyMemberFromPrompt(targetSelect = els.memberSelect) {
  const name = prompt("Naam van nieuw gezinslid:");
  if (!name || !name.trim()) {
    targetSelect.value = targetSelect === els.taskAssignee ? GENERAL_ASSIGNEE : selectedMember();
    return;
  }

  const cleanName = name.trim();
  const customMembers = getFamilyMembers().filter((member) => !DEFAULT_FAMILY_MEMBERS.includes(member));
  if (!customMembers.includes(cleanName) && !DEFAULT_FAMILY_MEMBERS.includes(cleanName)) {
    localStorage.setItem(STORAGE_KEYS.customMembers, JSON.stringify([...customMembers, cleanName]));
  }

  refreshMemberSelects(cleanName);
  if (targetSelect === els.memberSelect) {
    els.memberSelect.value = cleanName;
    localStorage.setItem(STORAGE_KEYS.member, cleanName);
  } else {
    els.taskAssignee.value = cleanName;
  }
}

function hydrateFilters() {
  els.searchInput.value = state.filters.search;
  els.filterRoom.value = state.filters.room;
  els.filterCategory.value = state.filters.category;
  els.filterStatus.value = state.filters.status;
  els.filterPriority.value = state.filters.priority;
  if (localStorage.getItem(STORAGE_KEYS.notifications) === "true") {
    els.notificationButton.textContent = "Meldingen toegestaan";
  }
}

function readFiltersFromControls() {
  return {
    search: els.searchInput.value,
    room: els.filterRoom.value,
    category: els.filterCategory.value,
    status: els.filterStatus.value,
    priority: els.filterPriority.value
  };
}

function clearFilters() {
  state.filters = { search: "", room: "", category: "", status: "Actief", priority: "" };
  localStorage.setItem(STORAGE_KEYS.filters, JSON.stringify(state.filters));
  hydrateFilters();
  render();
}

function loadFilters() {
  try {
    const loaded = {
      search: "",
      room: "",
      category: "",
      status: "Actief",
      priority: "",
      ...JSON.parse(localStorage.getItem(STORAGE_KEYS.filters) || "{}")
    };
    if (!VIEW_FILTERS.includes(loaded.status)) loaded.status = "Actief";
    return loaded;
  } catch {
    return { search: "", room: "", category: "", status: "Actief", priority: "" };
  }
}

function selectedMember() {
  return els.memberSelect.value && els.memberSelect.value !== ADD_MEMBER_VALUE ? els.memberSelect.value : getFamilyMembers()[0];
}

function duplicateKey(name, room) {
  return `${String(name).trim().toLowerCase()}|${String(room).trim().toLowerCase()}`;
}

function statusClass(status) {
  return `status-${slug(status)}`;
}

function slug(value) {
  return String(value).toLowerCase().replace(/\s+/g, "-");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showError(message) {
  els.errorBox.textContent = message;
  els.errorBox.classList.remove("hidden");
}

function hideError() {
  els.errorBox.textContent = "";
  els.errorBox.classList.add("hidden");
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.warn("Service worker registratie mislukt", error);
    });
  }
}

window.addEventListener("beforeunload", () => {
  if (unsubscribeTasks) unsubscribeTasks();
});
