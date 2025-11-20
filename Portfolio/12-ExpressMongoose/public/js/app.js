document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("driver-form");
  if (!form) {
    return;
  }

  const formTitle = document.querySelector("[data-form-title]");
  const driverIdInput = document.getElementById("driverId");
  const numberInput = document.getElementById("num");
  const codeInput = document.getElementById("code");
  const forenameInput = document.getElementById("forename");
  const surnameInput = document.getElementById("surname");
  const dobInput = document.getElementById("dob");
  const nationalitySelect = document.getElementById("nationality");
  const urlInput = document.getElementById("url");
  const teamSelect = document.getElementById("teamId");
  const toggleButton = document.getElementById("toggleView");
  const driverList = document.getElementById("driverList");
  const teamList = document.getElementById("teamList");

  const setFormTitle = (text) => {
    if (formTitle) {
      formTitle.textContent = text;
    }
  };

  const fillForm = (button) => {
    setFormTitle("Edit driver");
    driverIdInput.value = button.dataset.id || "";
    numberInput.value = button.dataset.num || "";
    codeInput.value = button.dataset.code || "";
    forenameInput.value = button.dataset.forename || "";
    surnameInput.value = button.dataset.surname || "";
    dobInput.value = button.dataset.dob || "";
    nationalitySelect.value = button.dataset.nationality || "";
    urlInput.value = button.dataset.url || "";
    teamSelect.value = button.dataset.teamId || "";
    numberInput.focus();
  };

  const resetFormState = () => {
    driverIdInput.value = "";
    setFormTitle("Driver information");
  };

  document.querySelectorAll("[data-edit-driver]").forEach((button) => {
    button.addEventListener("click", () => fillForm(button));
  });

  document.querySelectorAll("[data-delete-driver-form]").forEach((formElement) => {
    formElement.addEventListener("submit", (event) => {
      const driverName = formElement.dataset.driverName || "this driver";
      const confirmed = window.confirm(`Delete ${driverName}? This action cannot be undone.`);
      if (!confirmed) {
        event.preventDefault();
      }
    });
  });

  form.addEventListener("reset", () => {
    requestAnimationFrame(() => {
      resetFormState();
    });
  });

  if (toggleButton && driverList && teamList) {
    toggleButton.addEventListener("click", () => {
      const showingDrivers = !driverList.classList.contains("hidden");
      driverList.classList.toggle("hidden", showingDrivers);
      teamList.classList.toggle("hidden", !showingDrivers);
      toggleButton.textContent = showingDrivers ? "Show drivers" : "Show teams";
    });
  }
});
