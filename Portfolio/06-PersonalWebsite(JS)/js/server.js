// keep every activity so we can switch between months and weeks later.
const activities = [];

// track which month and week are currently visible in the table view.
const scheduleState = {
  currentMonth: startOfMonth(new Date()),
  currentWeek: getWeekOfMonth(new Date()),
};

// cache all DOM nodes we need for the schedule so we only touch the DOM once.
const scheduleElements = {
  tableBody: document.querySelector("#scheduleTableBody"),
  spinner: document.querySelector("#scheduleSpinner"),
  monthLabel: document.querySelector("#currentMonthLabel"),
  weekLabel: document.querySelector("#currentWeekLabel"),
  weekSummaryText: document.querySelector("#weekSummaryText"),
  monthSummaryText: document.querySelector("#monthSummaryText"),
  weekButtonContainers: [
    document.querySelector("#weekButtonGroup"),
    document.querySelector("#weekFooterButtons"),
  ].filter(Boolean),
  previousMonthBtn: document.querySelector("#previousMonthBtn"),
  nextMonthBtn: document.querySelector("#nextMonthBtn"),
};

initializeSchedule();

function initializeSchedule() {
  // ff the schedule table is not present we stop quietly.
  if (!scheduleElements.tableBody) return;

  scheduleElements.previousMonthBtn?.addEventListener("click", () => {
    changeVisibleMonth(-1);
  });

  scheduleElements.nextMonthBtn?.addEventListener("click", () => {
    changeVisibleMonth(1);
  });

  renderSchedule();
}

function getData() {
  if (!scheduleElements.tableBody) return;

  const rawDate = document.querySelector("#activityDate")?.value ?? "";
  if (!rawDate) return;

  const activityDate = new Date(rawDate);
  if (Number.isNaN(activityDate.getTime())) return;

  const startTime = document.querySelector("#startTime")?.value ?? "";
  const endTime = document.querySelector("#endTime")?.value ?? "";
  const activityName = document.querySelector("#activityName")?.value ?? "";
  const activityType = document.querySelector("#activityType")?.value ?? "";
  const activityNotes = (
    document.querySelector("#activityNotes")?.value ?? ""
  ).trim();
  const activityFlag =
    document.querySelector("#activityColor")?.value ?? "#0d6efd";

  const statusInput = document.querySelector(
    'input[name="statusOptions"]:checked'
  );
  const statusLabel = statusInput
    ? document.querySelector(`label[for="${statusInput.id}"]`)
    : null;
  const statusText = statusLabel
    ? statusLabel.textContent.trim()
    : statusInput?.value ?? "Free";

  const activity = {
    id: Date.now(),
    date: activityDate,
    startTime,
    endTime,
    name: activityName,
    type: activityType,
    notes: activityNotes,
    flag: activityFlag,
    status: statusText,
  };

  activities.push(activity);

  //  go straight to the month and week of the activity we just saved.
  scheduleState.currentMonth = startOfMonth(activityDate);
  scheduleState.currentWeek = getWeekOfMonth(activityDate);

  renderSchedule();
}

function renderSchedule() {
  if (!scheduleElements.tableBody) return;

  scheduleElements.spinner?.classList.add("d-none");
  scheduleElements.spinner?.setAttribute("aria-hidden", "true");

  const monthDate = scheduleState.currentMonth;
  const weeksInMonth = getWeeksInMonth(monthDate) || 1;

  if (scheduleState.currentWeek > weeksInMonth) {
    scheduleState.currentWeek = weeksInMonth;
  }
  if (scheduleState.currentWeek < 1) {
    scheduleState.currentWeek = 1;
  }

  const monthActivities = activities.filter((activity) =>
    isSameMonth(activity.date, monthDate)
  );

  updateMonthAndWeekLabels(monthDate, weeksInMonth);
  buildWeekButtons(weeksInMonth, monthActivities);
  fillScheduleTable(monthActivities, monthDate);
}

function changeVisibleMonth(offset) {
  const nextMonth = new Date(scheduleState.currentMonth);
  nextMonth.setMonth(nextMonth.getMonth() + offset);
  scheduleState.currentMonth = startOfMonth(nextMonth);
  scheduleState.currentWeek = 1;
  renderSchedule();
}

function buildWeekButtons(totalWeeks, monthActivities) {
  if (!scheduleElements.weekButtonContainers.length) return;

  const weeksWithActivities = new Set(
    monthActivities.map((activity) => getWeekOfMonth(activity.date))
  );

  scheduleElements.weekButtonContainers.forEach((container) => {
    container.innerHTML = "";

    for (let week = 1; week <= totalWeeks; week += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `btn btn-outline-secondary${
        scheduleState.currentWeek === week ? " active" : ""
      }`;
      button.textContent = `Week ${week}`;
      button.addEventListener("click", () => {
        scheduleState.currentWeek = week;
        renderSchedule();
      });

      if (!weeksWithActivities.has(week)) {
        button.classList.add("opacity-75");
        button.title = "No activities yet for this week";
      }

      container.append(button);
    }
  });
}

function fillScheduleTable(monthActivities, monthDate) {
  scheduleElements.tableBody.innerHTML = "";

  const selectedWeek = scheduleState.currentWeek;
  const weekActivities = monthActivities
    .filter((activity) => getWeekOfMonth(activity.date) === selectedWeek)
    .sort(compareActivities);

  const { start, end } = getWeekDateRange(monthDate, selectedWeek);
  const weekRangeLabel = `${formatShortDate(start)} – ${formatShortDate(end)}`;

  if (scheduleElements.weekSummaryText) {
    scheduleElements.weekSummaryText.textContent = `Week ${selectedWeek} (${weekRangeLabel})`;
  }

  if (scheduleElements.monthSummaryText) {
    const activityCount = weekActivities.length;
    scheduleElements.monthSummaryText.textContent =
      activityCount > 0
        ? `${activityCount} activit${
            activityCount === 1 ? "y" : "ies"
          } planned for Week ${selectedWeek}.`
        : "No activities saved for this week yet.";
  }

  if (!weekActivities.length) {
    const emptyRow = document.createElement("tr");
    const emptyCell = document.createElement("td");
    emptyCell.colSpan = 7;
    emptyCell.className = "text-center text-secondary py-4";
    emptyCell.textContent =
      "Nothing scheduled for this week. Add an activity with the form on the right.";
    emptyRow.append(emptyCell);
    scheduleElements.tableBody.append(emptyRow);
    return;
  }

  weekActivities.forEach((activity) => {
    scheduleElements.tableBody.append(renderActivityRow(activity));
  });
}

function updateMonthAndWeekLabels(monthDate, totalWeeks) {
  const monthLabel = formatMonthLabel(monthDate);
  if (scheduleElements.monthLabel) {
    scheduleElements.monthLabel.textContent = monthLabel;
  }
  if (scheduleElements.weekLabel) {
    scheduleElements.weekLabel.textContent = `Week ${scheduleState.currentWeek} of ${monthLabel}`;
  }
}

function renderActivityRow(activity) {
  const row = document.createElement("tr");
  row.append(createStatusCell(activity.flag, activity.status));
  row.append(createCell(formatFullDate(activity.date)));
  row.append(createCell(formatTime(activity.startTime)));
  row.append(createCell(formatTime(activity.endTime)));
  row.append(createCell(activity.name));
  row.append(createCell(capitalize(activity.type)));
  row.append(createCell(activity.notes || "No notes"));
  return row;
}

function createStatusCell(color, status) {
  const cell = document.createElement("td");
  const wrapper = document.createElement("span");
  wrapper.className = "d-inline-flex align-items-center gap-2";

  const dot = document.createElement("span");
  dot.className = "rounded-circle border";
  dot.style.backgroundColor = color;
  dot.style.borderColor = color;
  dot.style.display = "inline-block";
  dot.style.width = "12px";
  dot.style.height = "12px";

  const label = document.createElement("span");
  label.className = "fw-semibold text-secondary text-capitalize";
  label.textContent = status.toLowerCase();

  wrapper.append(dot, label);
  cell.append(wrapper);
  return cell;
}

function formatTime(timeValue) {
  if (!timeValue) return "";
  const [hours, minutes] = timeValue.split(":");
  if (hours === undefined || minutes === undefined) return timeValue;
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function createCell(content) {
  const cell = document.createElement("td");
  cell.textContent = content;
  return cell;
}

function capitalize(text) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatFullDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatShortDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatMonthLabel(date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function startOfMonth(date) {
  const copy = new Date(date);
  copy.setDate(1);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getWeekOfMonth(date) {
  const day = new Date(date);
  const firstDay = new Date(day.getFullYear(), day.getMonth(), 1);
  return Math.ceil((day.getDate() + firstDay.getDay()) / 7);
}

function getWeeksInMonth(date) {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return getWeekOfMonth(lastDay);
}

function getWeekDateRange(monthDate, weekNumber) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const firstDayWeekday = firstDayOfMonth.getDay();

  const tentativeStart = new Date(
    year,
    month,
    1 + (weekNumber - 1) * 7 - firstDayWeekday
  );
  const start =
    tentativeStart.getMonth() === month
      ? tentativeStart
      : new Date(year, month, 1);

  const tentativeEnd = new Date(start);
  tentativeEnd.setDate(start.getDate() + 6);
  const end =
    tentativeEnd.getMonth() === month
      ? tentativeEnd
      : new Date(year, month + 1, 0);

  return { start, end };
}

function isSameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function compareActivities(a, b) {
  const dateDiff = a.date - b.date;
  if (dateDiff !== 0) return dateDiff;
  return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
}

function timeToMinutes(timeValue) {
  const [hours, minutes] = timeValue.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}
