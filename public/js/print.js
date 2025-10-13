export function setupPrint(pageTitle) {
  try {
    const printBtn = document.getElementById("printReportBtn");
    if (printBtn) {
      printBtn.addEventListener("click", () => window.print());
    }

    const titleEl = document.getElementById("printReportTitle");
    if (titleEl && pageTitle) {
      titleEl.textContent = pageTitle;
    }

    const tsEl = document.getElementById("printTimestamp");
    if (tsEl) {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
      tsEl.textContent = stamp;
    }
  } catch (err) {
    // Fail silently; printing is non-critical to data paths
    console.error("setupPrint error", err);
  }
}
