document.addEventListener("DOMContentLoaded", () => {
  const tokenInput = document.getElementById("token");
  const saveBtn = document.getElementById("saveBtn");
  const status = document.getElementById("status");

  if (!tokenInput || !saveBtn || !status) {
    console.error("One or more elements not found");
    return;
  }

  chrome.storage.local.get("hfToken", (res) => {
    if (res.hfToken) {
      tokenInput.value = res.hfToken;
    }
  });

  saveBtn.addEventListener("click", () => {
    const token = tokenInput.value.trim();

    if (!token) {
      status.textContent = "Token cannot be empty";
      status.style.color = "red";
      return;
    }

    chrome.storage.local.set({ hfToken: token }, () => {
      status.textContent = "Token saved successfully ✔";
      status.style.color = "#16a34a";
    });
  });
});
