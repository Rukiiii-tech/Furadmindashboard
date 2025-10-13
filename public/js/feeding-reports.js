import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
  Timestamp,
  startAfter,
  limit,
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";
import {
  showGenericModal,
  initializeModalCloseListeners,
} from "./modal_handler.js";
import { showErrorNotification } from "./notification-modal.js";

let allFeedingReportsData = {};
let lastVisible = null; // Stores the last document of the current page for pagination
let firstVisible = null; // Stores the first document of the current page
let currentPage = 1;
const REPORTS_PER_PAGE = 10;
// Define the window in milliseconds for "On Feeding" status (4 minutes)
const ON_FEEDING_WINDOW_MS = 4 * 60 * 1000;

// Helper to format a time string (e.g., '14:30' from a document field)
// or a Date object (if converting a Timestamp) into 'H:MM AM/PM' format.
function formatTime(timeInput) {
  if (!timeInput) return "N/A";

  let hours, minutes;

  if (typeof timeInput === "string") {
    // Handle string format like '14:30'
    const parts = timeInput.split(":");
    if (parts.length < 2) return timeInput;
    hours = parseInt(parts[0]);
    minutes = parts[1];
  } else if (timeInput instanceof Date) {
    // Handle Date object (from Timestamp.toDate())
    hours = timeInput.getHours();
    minutes = timeInput.getMinutes().toString().padStart(2, "0");
  } else {
    return "N/A";
  }

  // Convert to 12-hour format
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'

  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Fetches all necessary external data (Users, Pets, Bookings) to augment reports.
 * This is crucial for fixing N/A for Pet Name, Owner Name, and Room Type.
 * @returns {Promise<{usersMap: Map, petsMap: Map, bookingsMap: Map}>} Maps for quick lookup.
 */
const fetchBatchDetails = async () => {
  // 1. Fetch all required documents concurrently
  const [usersSnapshot, petsSnapshot, bookingsSnapshot] = await Promise.all([
    getDocs(query(collection(db, "users"))),
    getDocs(query(collection(db, "pets"))),
    getDocs(query(collection(db, "bookings"))),
  ]);

  // 2. Map IDs to Data
  const usersMap = new Map();
  usersSnapshot.forEach((doc) => {
    const data = doc.data();
    usersMap.set(doc.id, {
      name: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
    });
  });

  const petsMap = new Map();
  petsSnapshot.forEach((doc) => {
    petsMap.set(doc.id, doc.data().petName);
  });

  const bookingsMap = new Map();
  bookingsSnapshot.forEach((doc) => {
    const data = doc.data();
    bookingsMap.set(doc.id, {
      // Priority for cageType from petProfile, fallback to selectedRoomType
      roomType:
        data.petProfile?.cageType || data.boardingDetails?.selectedRoomType,
      foodBrand: data.petProfile?.foodBrand, // Fetched but not displayed
    });
  });

  return { usersMap, petsMap, bookingsMap };
};

document.addEventListener("DOMContentLoaded", async () => {
  const feedingTableBody = document.getElementById("feedingTableBody");
  if (!feedingTableBody) {
    console.error("feedingTableBody not found!");
    return;
  }

  // Initialize modal close listeners once, for the detailsModal
  const modal = document.getElementById("detailsModal");
  if (modal) {
    initializeModalCloseListeners(
      modal,
      "modalCloseBtn",
      "modalCloseBtnFooter"
    );
  }

  const prevPageBtn = document.getElementById("prevPageBtn");
  const nextPageBtn = document.getElementById("nextPageBtn");
  const pageInfoSpan = document.getElementById("pageInfo");

  // Event Listeners for pagination buttons
  if (prevPageBtn) {
    prevPageBtn.addEventListener("click", () => navigatePage(-1));
  }
  if (nextPageBtn) {
    nextPageBtn.addEventListener("click", () => navigatePage(1));
  }

  const navigatePage = (direction) => {
    if (direction === 1 && nextPageBtn.disabled) return;
    if (direction === -1 && prevPageBtn.disabled) return;
    currentPage += direction;
    renderFeedingReportsTable();
  };

  const fetchFeedingReports = async (lastDoc, direction = 1) => {
    try {
      console.log(`Fetching feeding reports for page ${currentPage}...`);
      const feedingReportsRef = collection(db, "feedingHistory");
      let baseQuery = query(feedingReportsRef, orderBy("scheduledAt", "desc"));

      if (lastDoc) {
        if (direction === 1) {
          baseQuery = query(baseQuery, startAfter(lastDoc));
        } else if (direction === -1) {
          // To go backward, we need to reverse the order and then reverse the results
          baseQuery = query(
            collection(db, "feedingHistory"),
            orderBy("scheduledAt", "asc"),
            startAfter(lastDoc)
          );
        }
      }

      const paginatedQuery = query(baseQuery, limit(REPORTS_PER_PAGE));
      const querySnapshot = await getDocs(paginatedQuery);

      let feedingReports = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        feedingReports.push({ id: doc.id, ...data });
      });

      // If navigating backward, reverse the array to maintain correct order
      if (direction === -1) {
        feedingReports.reverse();
      }

      console.log("Query snapshot size:", querySnapshot.size);
      console.log("Final feeding reports array:", feedingReports);

      // Update the lastVisible and firstVisible documents for the next/prev queries
      firstVisible = querySnapshot.docs[0];
      lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

      return feedingReports;
    } catch (error) {
      console.error("Error fetching feeding reports:", error);
      return [];
    }
  };

  const renderFeedingReportsTable = async () => {
    const feedingTableBody = document.getElementById("feedingTableBody");
    // Colspan set to 6
    feedingTableBody.innerHTML =
      '<tr><td colspan="6" style="text-align: center; padding: 20px;">Loading feeding reports...</td></tr>';

    let lastDoc = null;
    if (currentPage > 1) {
      // Find the last visible doc of the previous page
      const previousPagesQuery = query(
        collection(db, "feedingHistory"),
        orderBy("scheduledAt", "desc"),
        limit((currentPage - 1) * REPORTS_PER_PAGE)
      );
      const previousSnapshot = await getDocs(previousPagesQuery);
      if (!previousSnapshot.empty) {
        lastDoc = previousSnapshot.docs[previousSnapshot.docs.length - 1];
      }
    }

    const feedingReports = await fetchFeedingReports(lastDoc);

    // Check if there's a next page by querying for one more document
    const nextPageCheckQuery = query(
      collection(db, "feedingHistory"),
      orderBy("scheduledAt", "desc"),
      startAfter(lastVisible),
      limit(1)
    );
    const nextPageSnapshot = await getDocs(nextPageCheckQuery);

    const hasNextPage = !nextPageSnapshot.empty;
    const hasPrevPage = currentPage > 1;

    // Update button states and page info
    prevPageBtn.disabled = !hasPrevPage;
    nextPageBtn.disabled = !hasNextPage;
    pageInfoSpan.textContent = `Page ${currentPage}`;

    feedingTableBody.innerHTML = "";

    if (feedingReports.length === 0) {
      // Colspan set to 6
      feedingTableBody.innerHTML =
        "<tr><td colspan='6' style='text-align: center; padding: 20px;'>No feeding reports found.</td></tr>";
      return;
    }

    // --- BATCH FETCH AND AUGMENT REPORTS ---
    const { usersMap, petsMap, bookingsMap } = await fetchBatchDetails();

    const tempFeedingReportsData = {};

    // Augment reports with display names/types using the maps
    const reportsWithDetails = feedingReports.map((report) => {
      const petNameFromMap = petsMap.get(report.petId);
      const ownerFromMap = usersMap.get(report.userId);
      const bookingDetails = bookingsMap.get(report.bookingId) || {};

      let displayPetName = petNameFromMap || report.petName || "N/A";
      let displayOwnerName = ownerFromMap?.name || report.ownerName || "N/A";

      // Room Type Fix
      let displayRoomType =
        bookingDetails.roomType ||
        report.roomType ||
        report.roomNumber ||
        "N/A";

      // Food Type (Fetched but NOT used for display)
      let displayFoodType =
        report.foodBrand || bookingDetails.foodBrand || "N/A";

      // === STATUS FIX START: NEW LOGIC (Completed, On Feeding, Pending) ===
      let displayStatus = "Pending"; // Default status
      const now = new Date();
      let scheduledDate = null;
      if (report.scheduledAt instanceof Timestamp) {
        scheduledDate = report.scheduledAt.toDate();
      }

      if (report.actualTime) {
        // 1. Explicitly Completed
        displayStatus = "Completed";
      } else if (scheduledDate) {
        const timeDifference = now.getTime() - scheduledDate.getTime();

        if (timeDifference > 0 && timeDifference <= ON_FEEDING_WINDOW_MS) {
          // 2. On Feeding Window: Scheduled time met (passed > 0) but within 4 minutes.
          displayStatus = "On Feeding";
        } else if (timeDifference > ON_FEEDING_WINDOW_MS) {
          // 3. Auto-Completed: Scheduled time passed by more than 4 minutes.
          displayStatus = "Completed";
        } else {
          // 4. Pending: Scheduled for the future (timeDifference <= 0)
          displayStatus = "Pending";
        }
      } else {
        // Fallback for reports with missing scheduled time
        displayStatus = "Pending";
      }
      // === STATUS FIX END ===

      return {
        ...report,
        displayPetName,
        displayOwnerName,
        displayRoomType,
        displayFoodType,
        displayStatus,
      };
    });
    // --- END AUGMENTATION ---

    reportsWithDetails.forEach((report) => {
      tempFeedingReportsData[report.id] = report;
      const row = document.createElement("tr");

      let displayFeedingTime = "N/A";
      // Determine the best time display
      if (
        report.specificTimes &&
        Array.isArray(report.specificTimes) &&
        report.specificTimes.length > 0
      ) {
        // Display a list of all scheduled times
        displayFeedingTime = `<ul>${report.specificTimes.map((item) => `<li>${formatTime(item.time)}</li>`).join("")}</ul>`;
      } else if (report.scheduledAt instanceof Timestamp) {
        // Display a single scheduled time from a Timestamp
        displayFeedingTime = formatTime(report.scheduledAt.toDate());
      } else if (report.schedule && report.schedule.time) {
        // Fallback for older schedule structure (if needed)
        displayFeedingTime = formatTime(report.schedule.time);
      }
      // Note: Removed redundant checks for report.timestamp, report.scheduledAt string conversion

      const displayStatus = report.displayStatus;

      row.innerHTML = `
        <td>${report.id}</td>
        <td>${report.displayPetName}</td>
        <td>${report.displayRoomType}</td>
        <td>${displayFeedingTime}</td>
        <td><span class="status-badge status-${displayStatus.toLowerCase().replace(" ", "-")}">${displayStatus}</span></td>
        <td>
          <button class="action-btn btn-view" data-id="${report.id}">View</button>
        </td>
      `;
      feedingTableBody.appendChild(row);
    });

    allFeedingReportsData = tempFeedingReportsData;
    attachFeedingReportListeners();
  };

  /**
   * Attaches event listeners for the "View Details" buttons.
   */
  const attachFeedingReportListeners = () => {
    document.querySelectorAll(".btn-view").forEach((btn) => {
      btn.removeEventListener("click", handleViewDetailsClick);
    });
    document.querySelectorAll(".btn-view").forEach((btn) => {
      btn.addEventListener("click", handleViewDetailsClick);
    });
  };

  const handleViewDetailsClick = async (e) => {
    const reportId = e.target.getAttribute("data-id");
    viewFeedingReportDetails(reportId);
  };

  renderFeedingReportsTable();

  async function viewFeedingReportDetails(reportId) {
    let reportData = allFeedingReportsData[reportId];
    let isDataCached = !!reportData;

    if (!reportData) {
      console.log(
        `Feeding report ID ${reportId} not in cache, fetching from Firestore.`
      );
      const reportRef = doc(db, "feedingHistory", reportId);
      try {
        const reportSnap = await getDoc(reportRef);
        if (!reportSnap.exists()) {
          console.log(
            "Feeding report data not found in Firestore for ID: " + reportId
          );
          showErrorNotification(
            "Report Not Found",
            "Feeding report not found.",
            "The report may have been deleted or the ID may be incorrect.",
            "❌"
          );
          return;
        }
        reportData = reportSnap.data();
        allFeedingReportsData[reportId] = reportData;
        console.log("Feeding report data fetched from Firestore:", reportData);
      } catch (err) {
        console.error("Error fetching feeding report from Firestore:", err);
        showErrorNotification(
          "Error Loading Report",
          "Error fetching feeding report details: " + err.message,
          "Please check your internet connection and try again.",
          "❌"
        );
        return;
      }
    }

    // --- Augment missing details for single report fetch if not in cache ---
    if (!isDataCached || !reportData.displayOwnerName) {
      // Fetch Pet Name
      const petSnap = reportData.petId
        ? await getDoc(doc(db, "pets", reportData.petId))
        : { exists: false };
      reportData.displayPetName = petSnap.exists()
        ? petSnap.data().petName
        : reportData.petName || "N/A";

      // Fetch Owner Name
      const userSnap = reportData.userId
        ? await getDoc(doc(db, "users", reportData.userId))
        : { exists: false };
      reportData.displayOwnerName = userSnap.exists()
        ? `${userSnap.data().firstName || ""} ${userSnap.data().lastName || ""}`.trim()
        : reportData.ownerName || "N/A";

      // Fetch Booking details (Room Type)
      if (reportData.bookingId) {
        const bookingRef = doc(db, "bookings", reportData.bookingId);
        const bookingSnap = await getDoc(bookingRef);
        if (bookingSnap.exists()) {
          const bookingData = bookingSnap.data();
          reportData.displayRoomType =
            bookingData.petProfile?.cageType ||
            bookingData.boardingDetails?.selectedRoomType ||
            reportData.roomType ||
            reportData.roomNumber ||
            "N/A";
          reportData.displayFoodType =
            bookingData.petProfile?.foodBrand || reportData.foodBrand || "N/A";
        } else {
          reportData.displayRoomType =
            reportData.roomType || reportData.roomNumber || "N/A";
          reportData.displayFoodType = reportData.foodBrand || "N/A";
        }
      } else {
        reportData.displayRoomType =
          reportData.roomType || reportData.roomNumber || "N/A";
        reportData.displayFoodType = reportData.foodBrand || "N/A";
      }

      // === STATUS FIX START: NEW LOGIC (Completed, On Feeding, Pending) ===
      reportData.displayStatus = "Pending"; // Default status
      const now = new Date();
      let scheduledDate = null;
      if (reportData.scheduledAt instanceof Timestamp) {
        scheduledDate = reportData.scheduledAt.toDate();
      }

      if (reportData.actualTime) {
        // 1. Explicitly Completed
        reportData.displayStatus = "Completed";
      } else if (scheduledDate) {
        const timeDifference = now.getTime() - scheduledDate.getTime();

        if (timeDifference > 0 && timeDifference <= ON_FEEDING_WINDOW_MS) {
          // 2. On Feeding Window: Scheduled time met (passed > 0) but within 4 minutes.
          reportData.displayStatus = "On Feeding";
        } else if (timeDifference > ON_FEEDING_WINDOW_MS) {
          // 3. Auto-Completed: Scheduled time passed by more than 4 minutes.
          reportData.displayStatus = "Completed";
        } else {
          // 4. Pending: Scheduled for the future (timeDifference <= 0)
          reportData.displayStatus = "Pending";
        }
      } else {
        // Fallback for reports with missing scheduled time
        reportData.displayStatus = "Pending";
      }
      // === STATUS FIX END ===

      // Update cache with augmented data
      allFeedingReportsData[reportId] = reportData;
    }
    // --- END AUGMENTATION ---

    const modal = document.getElementById("detailsModal");
    const modalHeader = document.getElementById("modalHeader");
    const modalBody = document.getElementById("modalBody");

    modalHeader.textContent = `Feeding Report: ${reportId}`;

    let displayFeedingScheduleTimeForModal = "N/A";

    // Determine the best time display for the modal
    if (
      reportData.specificTimes &&
      Array.isArray(reportData.specificTimes) &&
      reportData.specificTimes.length > 0
    ) {
      // Display a list of all scheduled times
      displayFeedingScheduleTimeForModal = `<ul>${reportData.specificTimes.map((item) => `<li>${formatTime(item.time)}</li>`).join("")}</ul>`;
    } else if (reportData.scheduledAt instanceof Timestamp) {
      // Display a single scheduled time from a Timestamp, including date if it's not today (optional, but robust)
      const date = reportData.scheduledAt.toDate();
      const time = formatTime(date);
      displayFeedingScheduleTimeForModal = `${date.toLocaleDateString()} at ${time}`;
    } else if (reportData.schedule && reportData.schedule.time) {
      displayFeedingScheduleTimeForModal = formatTime(reportData.schedule.time);
    }
    // Note: Removed redundant checks for report.timestamp

    // Use augmented data for display
    const displayPetNameForModal = reportData.displayPetName || "N/A";
    const displayOwnerNameForModal = reportData.displayOwnerName || "N/A";
    const displayRoomTypeForModal = reportData.displayRoomType || "N/A";
    const displayStatusForModal = reportData.displayStatus || "N/A";

    let displayActualFeedingTimeForModal = reportData.actualTime
      ? formatTime(reportData.actualTime)
      : "N/A";

    modalBody.innerHTML = `
        <div class="info-section">
          <div class="info-group">
            <label>Customer</label>
            <span>${reportData.customerName || "N/A"}</span>
          </div>
          <div class="info-group">
            <label>Pet Name</label>
            <span>${displayPetNameForModal}</span>
          </div>
          <div class="info-group">
            <label>Owner Name</label>
            <span>${displayOwnerNameForModal}</span>
          </div>
          <div class="info-group">
            <label>Pet ID</label>
            <span>${reportData.petId || "N/A"}</span>
          </div>
          <div class="info-group">
            <label>User ID</label>
            <span>${reportData.userId || "N/A"}</span>
          </div>
          <div class="info-group">
            <label>Room Type</label>
            <span>${displayRoomTypeForModal}</span>
          </div>
          <div class="info-group">
            <label>Feeding Schedule Time</label>
            <span>${displayFeedingScheduleTimeForModal}</span>
          </div>
          <div class="info-group">
            <label>Actual Feeding Time</label>
            <span>${displayActualFeedingTimeForModal}</span>
          </div>
          <div class="info-group">
            <label>Notes</label>
            <span style="white-space: pre-wrap;">${reportData.notes || "No notes provided."}</span>
          </div>
          <div class="info-group">
            <label>Status</label>
            <span>${displayStatusForModal}</span>
          </div>
          <div class="info-group">
            <label>Picture Taken</label>
            ${reportData.picture ? `<img src="${reportData.picture}" alt="Feeding Picture" style="max-width:100%; height:auto;">` : `<span>No picture provided.</span>`}
          </div>
        </div>
      `;
    showGenericModal(modal);
  }
});
