"use strict";

const STORAGE_KEYS = {
  fishes: "Thai Fish Care_fishes",
  records: "Thai Fish Care_records",
};

const state = {
  fishes: [],
  records: [],
  currentView: "dashboard",
};

const $ = (selector) => document.querySelector(selector);

function loadData() {
  state.fishes = JSON.parse(localStorage.getItem(STORAGE_KEYS.fishes)) || [];
  state.records = JSON.parse(localStorage.getItem(STORAGE_KEYS.records)) || [];
}

function saveData() {
  localStorage.setItem(STORAGE_KEYS.fishes, JSON.stringify(state.fishes));
  localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(state.records));
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getFishName(fishId) {
  const fish = state.fishes.find((item) => item.id === fishId);
  return fish ? fish.name : "Unknown fish";
}

function showView(viewName) {
  state.currentView = viewName;
  document
    .querySelectorAll(".view")
    .forEach((view) => view.classList.remove("active"));
  $(`#${viewName}View`).classList.add("active");

  document.querySelectorAll(".nav-link").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });

  const titles = {
    dashboard: "Dashboard",
    fishes: "My Fishes",
    records: "Care Records",
  };
  $("#pageTitle").textContent = titles[viewName];
  $("#sidebar").classList.remove("open");

  if (viewName === "dashboard") renderDashboard();
  if (viewName === "fishes") renderFishes();
  if (viewName === "records") renderRecords();
}

function renderDashboard() {
  $("#totalFish").textContent = state.fishes.length;
  $("#totalFeeding").textContent = state.records.filter(
    (item) => item.type === "Feeding",
  ).length;
  $("#totalWater").textContent = state.records.filter(
    (item) => item.type === "Water change",
  ).length;

  const recent = [...state.records]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  $("#recentRows").innerHTML = recent
    .map(
      (record) => `
    <tr>
      <td>${formatDate(record.date)}</td>
      <td>${escapeHTML(getFishName(record.fishId))}</td>
      <td>${activityBadge(record.type)}</td>
      <td>${escapeHTML(record.details)}</td>
    </tr>
  `,
    )
    .join("");

  $("#recentEmpty").hidden = recent.length > 0;
}

function renderFishes(searchTerm = "") {
  const term = searchTerm.trim().toLowerCase();
  const filtered = state.fishes.filter((fish) =>
    `${fish.name} ${fish.species} ${fish.color}`.toLowerCase().includes(term),
  );

  $("#fishCount").textContent = `${filtered.length} fish`;
  $("#fishGrid").innerHTML = filtered
    .map(
      (fish) => `
    <article class="fish-card">
      <div class="fish-avatar" aria-hidden="true">🐟</div>
      <h3>${escapeHTML(fish.name)}</h3>
      <p>${escapeHTML(fish.species)} · ${escapeHTML(fish.color)}</p>
      <div class="fish-meta"><span>Started</span><strong>${escapeHTML(fish.startDate || "-")}</strong></div>
      <div class="card-actions">
        <button class="small-button" data-edit-fish="${fish.id}">Edit</button>
        <button class="small-button danger" data-delete-fish="${fish.id}">Delete</button>
      </div>
    </article>
  `,
    )
    .join("");

  $("#fishEmpty").hidden = filtered.length > 0;
}

function renderFishOptions() {
  const select = $("#recordFish");
  const previousValue = select.value;
  select.innerHTML =
    '<option value="">Select a fish</option>' +
    state.fishes
      .map(
        (fish) =>
          `<option value="${fish.id}">${escapeHTML(fish.name)}</option>`,
      )
      .join("");
  if (state.fishes.some((fish) => fish.id === previousValue))
    select.value = previousValue;
}

function renderRecords() {
  renderFishOptions();
  const filter = $("#recordFilter").value;
  const filtered = state.records
    .filter((record) => filter === "All" || record.type === filter)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  $("#recordRows").innerHTML = filtered
    .map(
      (record) => `
    <tr>
      <td>${formatDate(record.date)}</td>
      <td>${escapeHTML(getFishName(record.fishId))}</td>
      <td>${activityBadge(record.type)}</td>
      <td>${escapeHTML(record.details)}</td>
      <td><button class="small-button danger" data-delete-record="${record.id}">Delete</button></td>
    </tr>
  `,
    )
    .join("");

  $("#recordEmpty").hidden = filtered.length > 0;
}

function activityBadge(type) {
  let className = "";
  if (type === "Water change") className = "water";
  if (type === "Health observation") className = "health";
  return `<span class="activity-badge ${className}">${escapeHTML(type)}</span>`;
}

function escapeHTML(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}

function openFishDialog(fish = null) {
  $("#fishForm").reset();
  $("#fishError").textContent = "";
  $("#fishId").value = fish ? fish.id : "";
  $("#dialogTitle").textContent = fish ? "Edit fish" : "Add new fish";
  $("#fishName").value = fish ? fish.name : "";
  $("#fishSpecies").value = fish ? fish.species : "";
  $("#fishColor").value = fish ? fish.color : "";
  $("#fishBirthDate").value = fish ? fish.birthDate : "";
  $("#fishStartDate").value = fish
    ? fish.startDate
    : new Date().toISOString().slice(0, 10);
  $("#fishNotes").value = fish ? fish.notes : "";
  $("#fishDialog").showModal();
  $("#fishName").focus();
}

function handleFishSubmit(event) {
  event.preventDefault();

  const id = $("#fishId").value;
  const name = $("#fishName").value.trim();
  const species = $("#fishSpecies").value;
  const color = $("#fishColor").value.trim();
  const startDate = $("#fishStartDate").value;

  if (!name || !species || !color || !startDate) {
    $("#fishError").textContent = "Please complete all required fields.";
    return;
  }

  const fishData = {
    id: id || createId("fish"),
    name,
    species,
    color,
    birthDate: $("#fishBirthDate").value,
    startDate,
    notes: $("#fishNotes").value.trim(),
  };

  if (id) {
    state.fishes = state.fishes.map((fish) =>
      fish.id === id ? fishData : fish,
    );
    showToast("Fish information updated.");
  } else {
    state.fishes.push(fishData);
    showToast("New fish added.");
  }

  saveData();
  $("#fishDialog").close();
  renderFishes($("#fishSearch").value);
  renderDashboard();
  renderFishOptions();
}

function deleteFish(id) {
  const fish = state.fishes.find((item) => item.id === id);
  if (!fish || !confirm(`Delete ${fish.name} and all of its care records?`))
    return;

  state.fishes = state.fishes.filter((item) => item.id !== id);
  state.records = state.records.filter((record) => record.fishId !== id);
  saveData();
  renderFishes($("#fishSearch").value);
  renderDashboard();
  renderFishOptions();
  showToast("Fish and related records deleted.");
}

function handleRecordSubmit(event) {
  event.preventDefault();

  const fishId = $("#recordFish").value;
  const type = $("#recordType").value;
  const date = $("#recordDate").value;
  const details = $("#recordDetails").value.trim();

  if (!state.fishes.some((fish) => fish.id === fishId)) {
    showToast("Please add and select a fish first.");
    return;
  }
  if (!date || !details) {
    showToast("Please complete the record details.");
    return;
  }

  state.records.push({
    id: createId("record"),
    fishId,
    type,
    date,
    details,
    notes: $("#recordNotes").value.trim(),
  });

  saveData();
  $("#recordForm").reset();
  setDefaultRecordDate();
  renderRecords();
  renderDashboard();
  showToast("Care record saved.");
}

function deleteRecord(id) {
  if (!confirm("Delete this care record?")) return;
  state.records = state.records.filter((record) => record.id !== id);
  saveData();
  renderRecords();
  renderDashboard();
  showToast("Care record deleted.");
}

function setDefaultRecordDate() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  $("#recordDate").value = now.toISOString().slice(0, 16);
}

function bindEvents() {
  document.querySelectorAll(".nav-link").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });

  document.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.go));
  });

  $("#topAddFish").addEventListener("click", () => openFishDialog());
  $("#addFishButton").addEventListener("click", () => openFishDialog());
  $("#fishForm").addEventListener("submit", handleFishSubmit);
  $("#recordForm").addEventListener("submit", handleRecordSubmit);
  $("#fishSearch").addEventListener("input", (event) =>
    renderFishes(event.target.value),
  );
  $("#recordFilter").addEventListener("change", renderRecords);

  $("#fishGrid").addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-fish]");
    const deleteButton = event.target.closest("[data-delete-fish]");
    if (editButton) {
      const fish = state.fishes.find(
        (item) => item.id === editButton.dataset.editFish,
      );
      if (fish) openFishDialog(fish);
    }
    if (deleteButton) deleteFish(deleteButton.dataset.deleteFish);
  });

  $("#recordRows").addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-record]");
    if (button) deleteRecord(button.dataset.deleteRecord);
  });

  $("#closeDialog").addEventListener("click", () => $("#fishDialog").close());
  $("#cancelDialog").addEventListener("click", () => $("#fishDialog").close());
  $("#menuButton").addEventListener("click", () =>
    $("#sidebar").classList.toggle("open"),
  );
}

function initializeApp() {
  loadData();
  bindEvents();
  $("#todayLabel").textContent = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  setDefaultRecordDate();
  renderDashboard();
  renderFishes();
  renderFishOptions();
}

initializeApp();
