// js/bookings.js
import {
  db,
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  where,
  addDoc,
} from "./firebase-config.js";

// Import the modal handling functions
import { showGenericModal } from "./modal_handler.js";
import {
  showSuccessNotification,
  showErrorNotification,
  showWarningNotification,
  showConfirmationModal,
  showAdminNotesModal,
  showBookingRejectionModal,
  showNewRejectionModal,
  showNewRejectionSuccessModal,
} from "./notification-modal.js";
import {
  showRefreshIndicator,
  hideRefreshIndicator,
  showSuccessIndicator,
  showSuccessNotification as showToastSuccess,
  showInfoNotification as showToastInfo,
  showWarningNotification as showToastWarning,
} from "./realtime-indicator.js";
// Removed real-time rejection monitoring
import { initializeAcceptanceMonitoring } from "./realtime-acceptance-monitor.js";

let allBookingsData = {};
let currentStatusFilter = "Pending"; // Default filter to show only pending bookings
let currentDateFilter = "all"; // Default date filter
let refreshInterval; // Variable to store the refresh interval

document.addEventListener("DOMContentLoaded", async () => {
  const bookingsTableBody = document.getElementById("bookingsTableBody");
  const statusFilterSelect = document.getElementById("statusFilter");
  const dateFilterSelect = document.getElementById("dateFilter");
  const refreshButton = document.getElementById("refreshBookingsBtn");
  const customDateInputs = document.getElementById("customDateInputs");
  const startDate = document.getElementById("startDate");
  const endDate = document.getElementById("endDate");
  const showAllButton = document.getElementById("showAllBookingsBtn");

  // Basic checks for essential elements
  if (!bookingsTableBody) {
    console.error("bookingsTableBody not found!");
    return;
  }
  if (!refreshButton) {
    console.error(
      "refreshButton not found! Please add a button with id='refreshBookingsBtn' in your HTML."
    );
  }

  // Event listener for the status filter dropdown
  if (statusFilterSelect) {
    statusFilterSelect.value = currentStatusFilter;
    statusFilterSelect.addEventListener("change", (e) => {
      currentStatusFilter = e.target.value;
      applyFilters(); // Re-render table when filter changes
    });
  }

  // Event listener for the refresh button
  if (refreshButton) {
    refreshButton.addEventListener("click", async () => {
      await applyFilters(); // Re-render table when refresh button is clicked

      // Show refresh success notification
      showToastSuccess("Bookings refreshed successfully!");
    });
  }

  // Event listener for the date filter dropdown
  if (dateFilterSelect) {
    dateFilterSelect.addEventListener("change", (e) => {
      currentDateFilter = e.target.value;
      handleDateFilterChange();
    });
  }

  // Event listeners for custom date inputs
  if (startDate) {
    startDate.addEventListener("change", () => {
      applyFilters();
    });
  }
  if (endDate) {
    endDate.addEventListener("change", () => {
      applyFilters();
    });
  }

  // Event listener for the "Show All" button
  if (showAllButton) {
    showAllButton.addEventListener("click", () => {
      currentStatusFilter = "All";
      currentDateFilter = "all";
      if (statusFilterSelect) statusFilterSelect.value = "All";
      if (dateFilterSelect) dateFilterSelect.value = "all";
      if (customDateInputs) customDateInputs.style.display = "none";
      applyFilters();
    });
  }

  /**
   * Fetches all booking documents from the "bookings" collection in Firestore.
   * Orders them by 'timestamp' in descending order.
   * @returns {Array} An array of booking objects, each with an 'id' property.
   */
  const fetchAllBookingsFromFirestore = async () => {
    try {
      console.log("Fetching ALL bookings from Firestore...");
      const allBookingsQuery = query(
        collection(db, "bookings"),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(allBookingsQuery);
      console.log("ALL bookings query snapshot size:", querySnapshot.size);
      const bookings = [];
      querySnapshot.forEach((doc) => {
        bookings.push({ id: doc.id, ...doc.data() });
      });
      console.log("ALL bookings fetched:", bookings);
      return bookings;
    } catch (error) {
      console.error("Error fetching ALL bookings:", error);
      return [];
    }
  };

  /**
   * Handle date filter change to show/hide custom date inputs
   */
  const handleDateFilterChange = () => {
    if (customDateInputs) {
      if (currentDateFilter === "custom") {
        customDateInputs.style.display = "block";
        // Set default dates (current month)
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        if (startDate) startDate.value = firstDay.toISOString().split("T")[0];
        if (endDate) endDate.value = lastDay.toISOString().split("T")[0];
      } else {
        customDateInputs.style.display = "none";
      }
    }

    // Apply the filter
    applyFilters();
  };

  /**
   * Apply filters to bookings data
   */
  const applyFilters = () => {
    // This is defined inside DOMContentLoaded, ensuring it's accessible to other functions inside
    renderBookingsTable();
  };

  /**
   * Determines if a booking has the minimum required details to be accepted.
   * Currently enforces vaccination record presence for Boarding services.
   * @param {Object} booking - The booking object
   * @returns {boolean} - True if booking details are complete enough to accept
   */
  function isBookingDetailsComplete(booking) {
    // Require vaccination record image for Boarding
    if ((booking.serviceType || "").toLowerCase() === "boarding") {
      const hasVaccinationImage = !!booking.vaccinationRecord?.imageUrl;
      return hasVaccinationImage;
    }
    // For non-boarding services, accept by default unless specified later
    return true;
  }

  /**
   * Get the appropriate date for filtering from a booking
   * @param {Object} booking - The booking object
   * @returns {Date|null} - The date to use for filtering
   */
  const getBookingDate = (booking) => {
    // Try to get the check-in date first
    if (booking.boardingDetails?.checkInDate) {
      const date = new Date(booking.boardingDetails.checkInDate);
      if (!isNaN(date.getTime())) return date;
    }

    // Try grooming check-in date
    if (booking.groomingDetails?.groomingCheckInDate) {
      const date = new Date(booking.groomingDetails.groomingCheckInDate);
      if (!isNaN(date.getTime())) return date;
    }

    // Try the top-level date field
    if (booking.date) {
      const date = new Date(booking.date);
      if (!isNaN(date.getTime())) return date;
    }

    // Try the timestamp
    if (booking.timestamp) {
      return booking.timestamp.toDate();
    }

    return null;
  };

  /**
   * Renders the bookings table based on the current filter and fetched data.
   * Fetches all bookings, then filters them locally before rendering.
   */
  const renderBookingsTable = async () => {
    const allFetchedBookings = await fetchAllBookingsFromFirestore();
    let filteredBookings = allFetchedBookings;

    // Apply status filter if not "All"
    if (currentStatusFilter !== "All") {
      filteredBookings = allFetchedBookings.filter(
        (booking) =>
          (booking.status || "").toLowerCase() ===
            currentStatusFilter.toLowerCase() ||
          // Handle 'Accepted' filter also matching 'Approved' status in Firestore
          (currentStatusFilter === "Accepted" &&
            (booking.status || "").toLowerCase() === "approved") ||
          (currentStatusFilter === "Cancelled" &&
            (booking.status || "").toLowerCase() === "cancelled")
      );
    }

    // Apply date filter
    if (currentDateFilter !== "all") {
      filteredBookings = filteredBookings.filter((booking) => {
        const bookingDate = getBookingDate(booking);
        if (!bookingDate) return false;

        const now = new Date();
        const todayStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          0,
          0,
          0,
          0
        );
        const todayEnd = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999
        );

        let filterStartDate = todayStart;
        let filterEndDate = todayEnd;

        switch (currentDateFilter) {
          case "today":
            // Already set by default
            break;
          case "tomorrow":
            filterStartDate = new Date(todayStart);
            filterStartDate.setDate(todayStart.getDate() + 1);
            filterEndDate = new Date(todayEnd);
            filterEndDate.setDate(todayEnd.getDate() + 1);
            break;
          case "next7days":
            filterStartDate = todayStart;
            filterEndDate = new Date(todayEnd);
            filterEndDate.setDate(todayEnd.getDate() + 7);
            break;
          case "next30days":
            filterStartDate = todayStart;
            filterEndDate = new Date(todayEnd);
            filterEndDate.setDate(todayEnd.getDate() + 30);
            break;
          case "past7days":
            filterStartDate = new Date(todayStart);
            filterStartDate.setDate(todayStart.getDate() - 7);
            filterEndDate = todayEnd;
            break;
          case "past30days":
            filterStartDate = new Date(todayStart);
            filterStartDate.setDate(todayStart.getDate() - 30);
            filterEndDate = todayEnd;
            break;
          case "custom":
            const startDateValue = startDate ? startDate.value : null;
            const endDateValue = endDate ? endDate.value : null;

            if (startDateValue && endDateValue) {
              filterStartDate = new Date(startDateValue);
              filterStartDate.setHours(0, 0, 0, 0);
              filterEndDate = new Date(endDateValue);
              filterEndDate.setHours(23, 59, 59, 999);
            } else {
              return false;
            }
            break;
        }

        return bookingDate >= filterStartDate && bookingDate <= filterEndDate;
      });
    }

    const bookingsTableBody = document.getElementById("bookingsTableBody");
    bookingsTableBody.innerHTML = ""; // Clear existing rows

    if (filteredBookings.length === 0) {
      bookingsTableBody.innerHTML = `<tr><td colspan='10' style='text-align: center; padding: 20px;'>No ${currentStatusFilter.toLowerCase()} bookings found.</td></tr>`;
      return;
    }

    // Cache fetched data by ID for quick access during details view
    const tempBookingsData = {};
    filteredBookings.forEach((booking) => {
      tempBookingsData[booking.id] = booking;

      const submittedDate = booking.timestamp
        ? new Date(booking.timestamp.toDate()).toLocaleString()
        : "N/A";

      // Display logic for common and service-specific fields
      const displayedServiceType = booking.serviceType || "N/A";
      const displayedRoomType =
        booking.boardingDetails?.selectedRoomType || "N/A"; // Specific to boarding
      const displayedCheckInDate = booking.date || "N/A"; // Use top-level date
      const displayedCheckOutDate =
        booking.boardingDetails?.checkOutDate || "N/A"; // Specific to boarding

      let adminNotesDisplay = "N/A";
      if (booking.adminNotes && Array.isArray(booking.adminNotes)) {
        adminNotesDisplay = booking.adminNotes.join("<br>") || "N/A";
      } else if (booking.adminNotes && typeof booking.adminNotes === "string") {
        adminNotesDisplay = booking.adminNotes || "N/A";
      }

      const row = document.createElement("tr");
      const canAccept =
        booking.status === "Pending" && isBookingDetailsComplete(booking);
      const acceptDisabledAttr = canAccept
        ? ""
        : 'disabled aria-disabled="true" title="Complete vaccination record to accept"';
      row.innerHTML = `
        <td>${booking.id}</td>
        <td>${booking.petInformation?.petName || "N/A"}</td>
        <td>${booking.ownerInformation ? `${booking.ownerInformation.firstName || ""} ${booking.ownerInformation.lastName || ""}`.trim() : "N/A"}</td>
        <td>${displayedServiceType}</td>
        <td>${displayedRoomType}</td>
        <td>${displayedCheckInDate}</td>
        <td>${displayedCheckOutDate}</td>
        <td><span class="status-badge status-${booking.status ? booking.status.toLowerCase().replace(" ", "-") : "unknown"}">${booking.status || "N/A"}</span></td>
        <td>
          ${
            booking.status === "Pending"
              ? `
            <button class="action-btn btn-accept" data-id="${booking.id}" ${acceptDisabledAttr}>Accept</button>
            <button class="action-btn btn-reject" data-id="${booking.id}">Reject</button>
          `
              : booking.status === "Approved"
                ? `
            <button class="action-btn btn-checkin" data-id="${booking.id}">Check In</button>
          `
                : booking.status === "Check In"
                  ? `
            <button class="action-btn btn-checkout" data-id="${booking.id}">Checkout</button>
          `
                  : ""
          }
        </td>
        <td>
            <button class="action-btn btn-view" data-id="${booking.id}">View</button>
        </td>
      `;
      bookingsTableBody.appendChild(row);
    });
    allBookingsData = tempBookingsData; // Update global data reference for view details

    attachActionBtnListeners(); // Re-attach listeners after re-rendering the table
  };

  // Initial load of bookings table
  renderBookingsTable();

  /**
   * Attaches (and re-attaches) event listeners to action buttons (Accept, Reject, View).
   * This is called after each table re-render to ensure new buttons are interactive.
   */
  const attachActionBtnListeners = () => {
    // Remove existing listeners to prevent multiple firings
    document
      .querySelectorAll(".btn-accept")
      .forEach((btn) => btn.removeEventListener("click", handleAcceptClick));
    document
      .querySelectorAll(".btn-reject")
      .forEach((btn) => btn.removeEventListener("click", handleRejectClick));
    document
      .querySelectorAll(".btn-view")
      .forEach((btn) => btn.removeEventListener("click", handleViewClick)); //
    document
      .querySelectorAll(".btn-checkout")
      .forEach((btn) => btn.removeEventListener("click", handleCheckoutClick));
    document
      .querySelectorAll(".btn-checkin")
      .forEach((btn) => btn.removeEventListener("click", handleCheckinClick));

    // Attach new listeners
    document.querySelectorAll(".btn-accept").forEach((btn) => {
      btn.addEventListener("click", handleAcceptClick);
    });
    document.querySelectorAll(".btn-reject").forEach((btn) => {
      btn.addEventListener("click", handleRejectClick);
    });
    document.querySelectorAll(".btn-view").forEach((btn) => {
      btn.addEventListener("click", handleViewClick); //
    });
    document.querySelectorAll(".btn-checkout").forEach((btn) => {
      btn.addEventListener("click", handleCheckoutClick);
    });
    document.querySelectorAll(".btn-checkin").forEach((btn) => {
      btn.addEventListener("click", handleCheckinClick);
    });
  };

  /**
   * Handles the click event for the "Accept" button.
   * @param {Event} e - The click event object.
   */
  const handleAcceptClick = async (e) => {
    const bookingId = e.target.getAttribute("data-id");
    const booking = allBookingsData[bookingId];
    if (!isBookingDetailsComplete(booking)) {
      showWarningNotification(
        "Cannot Accept Booking",
        "Vaccination record is missing.",
        "Please ensure the customer has uploaded their pet's vaccination record before accepting this booking.",
        "⚠️"
      );
      return;
    }
    // Get customer name for the confirmation modal
    const customerName = booking.ownerInformation
      ? `${booking.ownerInformation.firstName || ""} ${booking.ownerInformation.lastName || ""}`.trim()
      : "Unknown Customer";

    const confirmAccept = await showConfirmationModal(
      `Confirm Acceptance for ${customerName}?`,
      "Are you sure you want to accept this booking? This action will mark it as 'Approved'.",
      "Accept Booking",
      "Cancel",
      "This will change the booking status from 'Pending' to 'Approved' and make it visible in the approved bookings section.",
      "❓"
    );
    if (confirmAccept) {
      const adminNotes = await showAdminNotesModal(
        "Add Admin Notes for Booking Acceptance",
        "Enter any notes or comments about accepting this booking...",
        "Accept Booking"
      );
      await updateBookingStatus(bookingId, "Accepted", adminNotes || "");
      renderBookingsTable(); // Re-render to reflect new status/filter
    }
  };

  /**
   * Converts rejection reason code to human-readable text
   * @param {string} reasonCode - The rejection reason code
   * @returns {string} Human-readable reason text
   */
  function getRejectionReasonText(reasonCode) {
    const reasonMap = {
      "vaccination-missing": "Missing or Invalid Vaccination Record",
      "incomplete-information": "Incomplete Booking Information",
      "capacity-full": "No Available Capacity",
      "unsuitable-pet": "Pet Not Suitable for Service",
      "behavior-concerns": "Pet Behavior Concerns",
      "health-issues": "Pet Health Issues",
      "owner-compliance": "Owner Non-Compliance",
      "payment-issues": "Payment or Deposit Issues",
      "schedule-conflict": "Schedule Conflict",
      "policy-violation": "Policy Violation",
      other: "Other Reason",
    };
    return reasonMap[reasonCode] || reasonCode;
  }

  /**
   * Handles the click event for the "Reject" button.
   * @param {Event} e - The click event object.
   */
  const handleRejectClick = async (e) => {
    const bookingId = e.target.getAttribute("data-id");
    const booking = allBookingsData[bookingId];

    if (!booking) {
      showErrorNotification(
        "Booking Not Found",
        "The booking data could not be retrieved.",
        "Please refresh the page and try again, or contact support if the issue persists.",
        "❌"
      );
      return;
    }

    // Use the new rejection modal
    const rejectionData = await showNewRejectionModal(bookingId, booking);

    if (rejectionData) {
      // Use the selected reason and notes as the admin notes
      const reasonText =
        rejectionData.reason +
        (rejectionData.notes ? ` - ${rejectionData.notes}` : "");

      await updateBookingStatus(bookingId, "Rejected", reasonText);

      // Show toast notification for rejection
      showToastWarning("Booking rejected successfully!");

      // Show success modal after rejection is completed
      await showNewRejectionSuccessModal(bookingId, booking, rejectionData);

      renderBookingsTable(); // Re-render to reflect new status/filter
    }
  };

  /**
   * Handles the click event for the "View" button.
   * This is the function directly responsible for triggering the display of details.
   * @param {Event} e - The click event object.
   */
  const handleViewClick = async (e) => {
    const bookingId = e.target.getAttribute("data-id");
    console.log(`View button clicked for Booking ID: ${bookingId}`);
    await viewBookingDetails(bookingId); //
  };

  /**
   * Handles the click event for the "Check In" button.
   * Updates the booking status to "Check In".
   * @param {Event} e - The click event object.
   */
  const handleCheckinClick = async (e) => {
    const bookingId = e.target.getAttribute("data-id");
    const confirmCheckin = await showConfirmationModal(
      `Confirm Check In for this pet?`,
      "Are you sure you want to check in this pet? This action will mark the booking as 'Check In'.",
      "Check In Pet",
      "Cancel",
      "This will change the booking status from 'Approved' to 'Check In' and the pet will be officially checked into the facility.",
      "🏠"
    );
    if (confirmCheckin) {
      const adminNotes = await showAdminNotesModal(
        "Add Check-in Notes",
        "Enter any notes about the pet's check-in process...",
        "Check In Pet"
      );
      await updateBookingStatus(bookingId, "Check In", adminNotes || "");
      renderBookingsTable(); // Re-render to reflect new status/filter
    }
  };

  /**
   * Handles the click event for the "Checkout" button.
   * Shows a modal with customer balance information.
   * @param {Event} e - The click event object.
   */
  const handleCheckoutClick = async (e) => {
    const bookingId = e.target.getAttribute("data-id");
    await showCheckoutModal(bookingId);
  };

  /**
   * Fetches and displays comprehensive details for a given booking ID using a modal.
   * It first checks a local cache, then falls back to Firestore if not found.
   * Displays information using the showGenericModal function from modal_handler.js.
   * @param {string} bookingId - The ID of the booking to view.
   */
  async function viewBookingDetails(bookingId) {
    let bookingData = allBookingsData[bookingId]; // Try to get from cache first

    // If not in cache, fetch from Firestore
    if (!bookingData) {
      console.log(
        `Booking ID ${bookingId} not in cache, fetching from Firestore.`
      );
      const bookingRef = doc(db, "bookings", bookingId);
      try {
        const bookingSnap = await getDoc(bookingRef);
        if (!bookingSnap.exists()) {
          alert("Booking data not found in Firestore for ID: " + bookingId);
          console.error(
            "Booking data not found in Firestore for ID: " + bookingId
          );
          return;
        }
        allBookingsData[bookingId] = bookingSnap.data(); // Cache it for future use
        bookingData = allBookingsData[bookingId];
        console.log("Booking data fetched from Firestore:", bookingData);
      } catch (err) {
        console.error("Error fetching booking from Firestore:", err);
        alert("Error fetching booking details: " + err.message);
        return;
      }
    } else {
      console.log("Booking data found in cache:", bookingData);
    }

    // --- FIX: Define customerName here to resolve ReferenceError ---
    const customerName = bookingData.ownerInformation
      ? `${bookingData.ownerInformation.firstName || ""} ${bookingData.ownerInformation.lastName || ""}`.trim()
      : "N/A";
    // ---------------------------------------------------------------

    // --- Construct the HTML for the modal content ---
    let detailsHtml = `
      <div class="modal-section">
        <h3>General Information</h3>
        <div class="info-item"><strong>Customer:</strong> <p>${customerName}</p></div>
        <div class="info-item"><strong>Service Type:</strong> <p>${bookingData.serviceType || "N/A"}</p></div>
        <div class="info-item"><strong>Status:</strong> <p>${bookingData.status || "N/A"}</p></div>
        <div class="info-item"><strong>Preferred Date:</strong> <p>${bookingData.date || "N/A"}</p></div>
        <div class="info-item"><strong>Preferred Time:</strong> <p>${bookingData.time || "N/A"}</p></div>
        <div class="info-item"><strong>Submitted On:</strong> <p>${bookingData.timestamp ? new Date(bookingData.timestamp.toDate()).toLocaleString() : "N/A"}</p></div>
      </div>

      <div class="modal-section">
        <h3>Owner Information</h3>
        <div class="info-item"><strong>Full Name:</strong> <p>${bookingData.ownerInformation ? `${bookingData.ownerInformation.firstName || ""} ${bookingData.ownerInformation.lastName || ""}`.trim() : "N/A"}</p></div>
        <div class="info-item"><strong>Email:</strong> <p>${bookingData.ownerInformation?.email || "N/A"}</p></div>
        <div class="info-item"><strong>Contact No:</strong> <p>${bookingData.ownerInformation?.contactNo || "N/A"}</p></div>
        <div class="info-item"><strong>Address:</strong> <p>${bookingData.ownerInformation?.address || "N/A"}</p></div>
      </div>

      <div class="modal-section">
        <h3>Pet Information</h3>
        <div class="info-item"><strong>Name:</strong> <p>${bookingData.petInformation?.petName || "N/A"}</p></div>
        <div class="info-item"><strong>Type:</strong> <p>${bookingData.petInformation?.petType || "N/A"}</p></div>
        <div class="info-item"><strong>Breed:</strong> <p>${bookingData.petInformation?.petBreed || "N/A"}</p></div>
    `;

    // Service-specific details
    if (bookingData.serviceType === "Boarding") {
      detailsHtml += `
        <div class="info-item"><strong>Age:</strong> <p>${bookingData.petInformation?.petAge || "N/A"}</p></div>
        <div class="info-item"><strong>Weight:</strong> <p>${bookingData.petInformation?.petWeight || "N/A"} kg</p></div>
      </div>

      <div class="modal-section">
        <h3>Boarding Details</h3>
        <div class="info-item"><strong>Check-in:</strong> <p>${bookingData.boardingDetails?.checkInDate || "N/A"}</p></div>
        <div class="info-item"><strong>Check-out:</strong> <p>${bookingData.boardingDetails?.checkOutDate || "N/A"}</p></div>
        <div class="info-item"><strong>Room Type:</strong> <p>${bookingData.boardingDetails?.selectedRoomType || "N/A"}</p></div>
        <div class="info-item"><strong>Waiver Agreed:</strong> <p>${bookingData.boardingDetails?.boardingWaiverAgreed ? "Yes" : "No"}</p></div>
      </div>

      <div class="modal-section">
        <h3>Feeding Details</h3>
        <div class="info-item"><strong>Food Brand:</strong> <p>${bookingData.feedingDetails?.foodBrand || "N/A"}</p></div>
        <div class="info-item"><strong>Meals/Day:</strong> <p>${bookingData.feedingDetails?.numberOfMeals || "N/A"}</p></div>
      `;
      if (bookingData.feedingDetails?.morningFeeding)
        detailsHtml += `  <div class="info-item"><strong>Morning Feeding:</strong> <p>${bookingData.feedingDetails?.morningTime || "N/A"}</p></div>`;
      if (bookingData.feedingDetails?.afternoonFeeding)
        detailsHtml += `  <div class="info-item"><strong>Afternoon Feeding:</strong> <p>${bookingData.feedingDetails?.afternoonTime || "N/A"}</p></div>`;
      if (bookingData.feedingDetails?.eveningFeeding)
        detailsHtml += `  <div class="info-item"><strong>Evening Feeding:</strong> <p>${bookingData.feedingDetails?.eveningTime || "N/A"}</p></div>`;
      detailsHtml += `</div>`; // Close feeding details section

      // --- Vaccination Record Image ---
      console.log(
        "Vaccination Image URL:",
        bookingData.vaccinationRecord?.imageUrl
      ); // Log the URL
      detailsHtml += `
      <div class="modal-section">
        <h3>Vaccination Record</h3>
        <div class="image-container">
          ${bookingData.vaccinationRecord?.imageUrl ? `<img src="${bookingData.vaccinationRecord.imageUrl}" alt="Vaccination Record" class="booking-image" onclick="window.open('${bookingData.vaccinationRecord.imageUrl}', '_blank')">` : `<p>No image provided</p>`}
        </div>
      </div>
      `;

      // --- Payment Details and Receipt Image ---
      console.log(
        "Payment Receipt Image URL:",
        bookingData.paymentDetails?.receiptImageUrl
      ); // Log the URL
      detailsHtml += `
      <div class="modal-section">
        <h3>Payment Details</h3>
        <div class="info-item"><strong>Method:</strong> <p>${bookingData.paymentDetails?.method || "N/A"}</p></div>
        <div class="info-item"><strong>Account:</strong> <p>${bookingData.paymentDetails?.accountNumber || "N/A"} (${bookingData.paymentDetails?.accountName || "N/A"})</p></div>
        <div class="image-container">
          ${bookingData.paymentDetails?.receiptImageUrl ? `<img src="${bookingData.paymentDetails.receiptImageUrl}" alt="Payment Receipt" class="booking-image" onclick="window.open('${bookingData.paymentDetails.receiptImageUrl}', '_blank')">` : `<p>No image provided</p>`}
        </div>
      </div>
      `;
    } else if (bookingData.serviceType === "Grooming") {
      detailsHtml += `
        <div class="info-item"><strong>Gender:</strong> <p>${bookingData.petInformation?.petGender || "N/A"}</p></div>
        <div class="info-item"><strong>Date of Birth:</strong> <p>${bookingData.petInformation?.dateOfBirth || "N/A"}</p></div>
        <div class="info-item"><strong>Colors/Markings:</strong> <p>${bookingData.petInformation?.petColorsMarkings || "N/A"}</p></div>
      </div>

      <div class="modal-section">
        <h3>Grooming Details</h3>
        <div class="info-item"><strong>Check-in Date:</strong> <p>${bookingData.groomingDetails?.groomingCheckInDate || "N/A"}</p></div>
        <div class="info-item"><strong>Waiver Agreed:</strong> <p>${bookingData.groomingDetails?.groomingWaiverAgreed ? "Yes" : "No"}</p></div>
      </div>
      `;
    }

    // Admin notes (handled as an array for consistency)
    let adminNotesArray = [];
    if (bookingData.adminNotes) {
      if (Array.isArray(bookingData.adminNotes)) {
        adminNotesArray = bookingData.adminNotes;
      } else if (typeof bookingData.adminNotes === "string") {
        adminNotesArray = [bookingData.adminNotes]; // Convert string to array
      }
    }
    detailsHtml += `
      <div class="modal-section">
        <h3>Admin Notes</h3>
        <p>${adminNotesArray.join("<br>") || "N/A"}</p>
      </div>
    `;

    // Get the modal element and the specific content target within it
    const viewDetailsModal = document.getElementById("viewDetailsModal");
    const bookingDetailsContent = document.getElementById(
      "bookingDetailsContent"
    ); // This is the div that will hold the generated HTML

    // Use showGenericModal from modal_handler.js
    showGenericModal(
      viewDetailsModal,
      `Booking Details: ${bookingId}`,
      detailsHtml,
      bookingDetailsContent
    );
  }

  /**
   * Creates a sales report entry when a booking is accepted.
   * @param {object} bookingData - The booking data from Firestore.
   * @param {string} bookingId - The ID of the booking.
   */
  async function createSalesReport(bookingData, bookingId) {
    try {
      // Calculate pricing based on service type and room type
      let totalAmount = 0;
      let downPayment = 0;
      let balance = 0;

      if (bookingData.serviceType === "Boarding") {
        // Pricing for boarding services
        const roomType =
          bookingData.boardingDetails?.selectedRoomType || "Small Kennel";
        switch (roomType) {
          case "Small Kennel":
            totalAmount = 500; // ₱500 per day
            break;
          case "Large Kennel":
            totalAmount = 800; // ₱800 per day
            break;
          case "VIP Suite":
            totalAmount = 1200; // ₱1200 per day
            break;
          default:
            totalAmount = 500;
        }

        // Calculate total based on number of days
        const checkInDate = new Date(
          bookingData.boardingDetails?.checkInDate || bookingData.date
        );
        const checkOutDate = new Date(
          bookingData.boardingDetails?.checkOutDate
        );
        const daysDiff = Math.ceil(
          (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
        );
        totalAmount = totalAmount * Math.max(1, daysDiff);
      } else if (bookingData.serviceType === "Grooming") {
        totalAmount = 800; // ₱800 for grooming service
      }

      // Calculate down payment (50% of total amount)
      downPayment = Math.round(totalAmount * 0.5);
      balance = totalAmount - downPayment;

      // Create sales report data
      const salesReportData = {
        "Transaction ID": bookingId,
        "Customer Name": bookingData.ownerInformation
          ? `${bookingData.ownerInformation.firstName || ""} ${bookingData.ownerInformation.lastName || ""}`.trim()
          : "N/A",
        "Service Type": bookingData.serviceType || "N/A",
        "Total Amount": totalAmount,
        "Down Payment": downPayment,
        Balance: balance,
        "Payment Method": bookingData.paymentDetails?.method || "Cash",
        Date: new Date().toISOString(),
        Status: "Completed",
        "Pet Name": bookingData.petInformation?.petName || "N/A",
        "Room Type": bookingData.boardingDetails?.selectedRoomType || "N/A",
        "Check-in Date":
          bookingData.boardingDetails?.checkInDate || bookingData.date || "N/A",
        "Check-out Date": bookingData.boardingDetails?.checkOutDate || "N/A",
      };

      // Add to salesR collection
      await addDoc(collection(db, "salesR"), salesReportData);
      console.log(`Sales report created for booking ${bookingId}`);
    } catch (error) {
      console.error("Error creating sales report:", error);
      // Don't throw error to avoid affecting the booking acceptance process
    }
  }

  /**
   * Shows a notification modal when a booking is successfully accepted by the admin.
   * @param {string} bookingId - The ID of the accepted booking.
   * @param {object} bookingData - The booking data from Firestore.
   */
  async function showBookingAcceptanceNotification(bookingId, bookingData) {
    try {
      // Get customer information
      const customerName = bookingData.ownerInformation
        ? `${bookingData.ownerInformation.firstName || ""} ${bookingData.ownerInformation.lastName || ""}`.trim()
        : "N/A";

      const petName = bookingData.petInformation?.petName || "N/A";
      const serviceType = bookingData.serviceType || "N/A";
      const roomType = bookingData.boardingDetails?.selectedRoomType || "N/A";

      // Format check-in date
      let checkInDate = "N/A";
      if (bookingData.boardingDetails?.checkInDate) {
        checkInDate = new Date(
          bookingData.boardingDetails.checkInDate
        ).toLocaleDateString();
      } else if (bookingData.date) {
        checkInDate = new Date(bookingData.date).toLocaleDateString();
      }

      // Format check-out date
      let checkOutDate = "N/A";
      if (bookingData.boardingDetails?.checkOutDate) {
        checkOutDate = new Date(
          bookingData.boardingDetails.checkOutDate
        ).toLocaleDateString();
      }

      // Create notification modal content
      const notificationContent = `
        <div class="modal-section" style="background: #d4edda; padding: 25px; border-radius: 12px; margin-bottom: 20px; border-left: 5px solid #28a745;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 4em; color: #28a745; margin-bottom: 15px;">✅</div>
            <h3 style="color: #155724; margin: 0; font-size: 1.5em; font-weight: bold;">Booking Successfully Accepted!</h3>
            <p style="color: #155724; margin: 10px 0 0 0; font-size: 1.1em;">The booking has been approved and is now ready for check-in.</p>
          </div>
        </div>

        <div class="modal-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #ffb64a; padding-bottom: 10px;">📋 Booking Details</h3>
          <div class="info-item" style="margin-bottom: 12px; padding: 8px; background: white; border-radius: 6px;">
            <strong style="color: #333;">Customer:</strong>
            <span style="font-weight: normal; color: #666; float: right;">${customerName}</span>
          </div>
          <div class="info-item" style="margin-bottom: 12px; padding: 8px; background: white; border-radius: 6px;">
            <strong style="color: #333;">Pet Name:</strong>
            <span style="font-weight: normal; color: #666; float: right;">${petName}</span>
          </div>
          <div class="info-item" style="margin-bottom: 12px; padding: 8px; background: white; border-radius: 6px;">
            <strong style="color: #333;">Service Type:</strong>
            <span style="font-weight: normal; color: #666; float: right;">${serviceType}</span>
          </div>
          <div class="info-item" style="margin-bottom: 12px; padding: 8px; background: white; border-radius: 6px;">
            <strong style="color: #333;">Room Type:</strong>
            <span style="font-weight: normal; color: #666; float: right;">${roomType}</span>
          </div>
          <div class="info-item" style="margin-bottom: 12px; padding: 8px; background: white; border-radius: 6px;">
            <strong style="color: #333;">Check-in Date:</strong>
            <span style="font-weight: normal; color: #666; float: right;">${checkInDate}</span>
          </div>
          <div class="info-item" style="margin-bottom: 0; padding: 8px; background: white; border-radius: 6px;">
            <strong style="color: #333;">Check-out Date:</strong>
            <span style="font-weight: normal; color: #666; float: right;">${checkOutDate}</span>
          </div>
        </div>

        <div class="modal-section" style="background: #e2e3e5; padding: 20px; border-radius: 8px; text-align: center;">
          <h3 style="color: #495057; margin-bottom: 15px;">📝 Next Steps</h3>
          <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
            <p style="color: #495057; margin: 0; font-size: 1.05em;">
              <strong>1.</strong> The customer will be notified of the approval<br>
              <strong>2.</strong> The booking is now visible in the "Approved Bookings" section<br>
              <strong>3.</strong> You can proceed with check-in when the customer arrives
            </p>
          </div>
          <div style="background: #d1ecf1; padding: 12px; border-radius: 6px; border: 1px solid #bee5eb;">
            <p style="color: #0c5460; margin: 0; font-weight: bold;">
              💡 <strong>Tip:</strong> You can view all approved bookings in the "Bookings" section of the dashboard.
            </p>
          </div>
        </div>
      `;

      // Get modal elements
      const modal = document.getElementById("viewDetailsModal");
      const modalContentDiv = document.getElementById("bookingDetailsContent");

      if (modal && modalContentDiv) {
        // Use showGenericModal from modal_handler.js
        await showGenericModal(
          modal,
          `Booking Accepted - ${customerName}`,
          notificationContent,
          modalContentDiv
        );
      } else {
        console.error("Modal elements not found for notification!");
        // Fallback to alert if modal elements not found
        alert(`Booking ${bookingId} has been successfully accepted!`);
      }
    } catch (error) {
      console.error("Error showing booking acceptance notification:", error);
      // Fallback to alert if there's an error
      alert(`Booking ${bookingId} has been successfully accepted!`);
    }
  }

  /**
   * Updates the status of a booking in Firestore and adds admin notes.
   * @param {string} bookingId - The ID of the booking to update.
   * @param {string} newStatus - The new status to set (e.g., "Accepted", "Rejected").
   * @param {string} adminNotes - Additional notes from the admin.
   */
  async function updateBookingStatus(bookingId, newStatus, adminNotes) {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      const bookingSnap = await getDoc(bookingRef);
      if (!bookingSnap.exists()) throw new Error("Booking not found");

      const bookingData = bookingSnap.data();
      let statusToUpdate = newStatus;
      // Change "Accepted" to "Approved" for Firestore storage if desired
      if (newStatus === "Accepted") {
        statusToUpdate = "Approved";

        // Create sales report when booking is accepted
        await createSalesReport(bookingData, bookingId);
      }

      // Ensure adminNotes is always handled as an array for update
      const currentAdminNotes = bookingData.adminNotes || [];
      const updatedAdminNotesArray = Array.isArray(currentAdminNotes)
        ? [...currentAdminNotes, adminNotes]
        : [currentAdminNotes, adminNotes]; // Convert if it was a string

      await updateDoc(bookingRef, {
        status: statusToUpdate,
        adminNotes: updatedAdminNotesArray,
        updatedAt: Timestamp.now(), // Add an update timestamp
      });
      console.log(
        `Booking ${bookingId} has been ${statusToUpdate.toLowerCase()}.`
      );

      // Show success notification modal instead of alert
      if (statusToUpdate === "Approved") {
        await showBookingAcceptanceNotification(bookingId, bookingData);
      } else if (statusToUpdate === "Rejected") {
        // Rejection success notification is handled by the new rejection flow
        // No need to show additional notification here
      } else {
        alert(`Booking ${statusToUpdate.toLowerCase()} successfully!`);
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      alert("Failed to update booking status: " + error.message);
    }
  }

  /**
   * Helper function for user confirmation using native browser confirm.
   * @param {string} title - The title of the confirmation dialog.
   * @param {string} message - The message of the confirmation dialog.
   * @returns {Promise<boolean>} Resolves with true if confirmed, false otherwise.
   */
  function showConfirmation(title, message) {
    return new Promise((resolve) => {
      resolve(confirm(`${title}\n\n${message}`));
    });
  }

  /**
   * Shows a checkout modal with customer balance information.
   * @param {string} bookingId - The ID of the booking to show checkout for.
   */
  async function showCheckoutModal(bookingId) {
    console.log("showCheckoutModal called with bookingId:", bookingId);

    let bookingData = allBookingsData[bookingId]; // Try to get from cache first
    console.log("Booking data from cache:", bookingData);

    // If not in cache, fetch from Firestore
    if (!bookingData) {
      console.log(
        `Booking ID ${bookingId} not in cache, fetching from Firestore.`
      );
      const bookingRef = doc(db, "bookings", bookingId);
      try {
        const bookingSnap = await getDoc(bookingRef);
        if (!bookingSnap.exists()) {
          alert("Booking data not found in Firestore for ID: " + bookingId);
          console.error(
            "Booking data not found in Firestore for ID: " + bookingId
          );
          return;
        }
        allBookingsData[bookingId] = bookingSnap.data(); // Cache it for future use
        bookingData = allBookingsData[bookingId];
        console.log("Booking data fetched from Firestore:", bookingData);
      } catch (err) {
        console.error("Error fetching booking from Firestore:", err);
        alert("Error fetching booking details: " + err.message);
        return;
      }
    }

    // Calculate balance using the same logic as sales reports
    const { totalAmount, downPayment, balance } =
      calculateBookingAmounts(bookingData);

    // Get customer name
    const customerName = bookingData.ownerInformation
      ? `${bookingData.ownerInformation.firstName || ""} ${bookingData.ownerInformation.lastName || ""}`.trim()
      : "N/A";

    // Create modal content with enhanced styling
    const modalContent = `
      <div class="modal-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #ffb64a; padding-bottom: 10px;">🐾 Pet Checkout Information</h3>
        <div class="info-item" style="margin-bottom: 10px;"><strong>Customer:</strong> <span style="font-weight: normal; color: #666;">${customerName}</span></div>
        <div class="info-item" style="margin-bottom: 10px;"><strong>Pet Name:</strong> <span style="font-weight: normal; color: #666;">${bookingData.petInformation?.petName || "N/A"}</span></div>
        <div class="info-item" style="margin-bottom: 10px;"><strong>Service Type:</strong> <span style="font-weight: normal; color: #666;">${bookingData.serviceType || "N/A"}</span></div>
        <div class="info-item" style="margin-bottom: 10px;"><strong>Room Type:</strong> <span style="font-weight: normal; color: #666;">${bookingData.boardingDetails?.selectedRoomType || "N/A"}</span></div>
      </div>

      <div class="modal-section" style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
        <h3 style="color: #856404; margin-bottom: 15px; border-bottom: 2px solid #ffc107; padding-bottom: 10px;">💰 Payment Summary</h3>
        <div class="info-item" style="margin-bottom: 15px; padding: 10px; background: white; border-radius: 5px;">
          <strong style="color: #333;">Total Amount:</strong>
          <span style="font-weight: bold; color: #28a745; font-size: 1.1em; float: right;">₱${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div class="info-item" style="margin-bottom: 15px; padding: 10px; background: white; border-radius: 5px;">
          <strong style="color: #333;">Down Payment Paid:</strong>
          <span style="font-weight: bold; color: #17a2b8; font-size: 1.1em; float: right;">₱${downPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div class="info-item" style="margin-bottom: 15px; padding: 15px; background: #f8d7da; border-radius: 5px; border: 2px solid #dc3545;">
          <strong style="color: #721c24; font-size: 1.2em;">BALANCE DUE:</strong>
          <span style="font-weight: bold; color: #dc3545; font-size: 1.3em; float: right;">₱${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div class="info-item" style="margin-bottom: 10px; padding: 10px; background: white; border-radius: 5px;">
          <strong style="color: #333;">Payment Method:</strong>
          <span style="font-weight: normal; color: #666; float: right;">${bookingData.paymentDetails?.method || "N/A"}</span>
        </div>
      </div>

      <div class="modal-section" style="background: #e2e3e5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #495057; margin-bottom: 15px; border-bottom: 2px solid #6c757d; padding-bottom: 10px;">📅 Stay Information</h3>
        <div class="info-item" style="margin-bottom: 10px;"><strong>Check-in Date:</strong> <span style="font-weight: normal; color: #666;">${bookingData.boardingDetails?.checkInDate || bookingData.date || "N/A"}</span></div>
        <div class="info-item" style="margin-bottom: 10px;"><strong>Check-out Date:</strong> <span style="font-weight: normal; color: #666;">${bookingData.boardingDetails?.checkOutDate || "N/A"}</span></div>
        <div class="info-item" style="margin-bottom: 10px;"><strong>Pet Size Category:</strong> <span style="font-weight: normal; color: #666;">${getPetSizeCategory(parseFloat(bookingData.petInformation?.petWeight))}</span></div>
        <div class="info-item" style="margin-bottom: 10px;"><strong>Pet Weight:</strong> <span style="font-weight: normal; color: #666;">${bookingData.petInformation?.petWeight || "N/A"} kg</span></div>
      </div>

      <div class="modal-section" style="background: #d1ecf1; padding: 20px; border-radius: 8px; text-align: center;">
        <h3 style="color: #0c5460; margin-bottom: 15px;">✅ Ready for Checkout</h3>
        <p style="color: #0c5460; font-size: 1.1em; margin: 0;">Please collect the remaining balance of <strong style="color: #dc3545;">₱${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> from the customer.</p>
      </div>
    `;

    // Get the modal element and the specific content target within it
    const viewDetailsModal = document.getElementById("viewDetailsModal");
    const bookingDetailsContent = document.getElementById(
      "bookingDetailsContent"
    );

    console.log("Modal elements found:", {
      viewDetailsModal: !!viewDetailsModal,
      bookingDetailsContent: !!bookingDetailsContent,
    });

    if (!viewDetailsModal || !bookingDetailsContent) {
      console.error("Modal elements not found!");
      alert(
        "Error: Modal elements not found. Please refresh the page and try again."
      );
      return;
    }

    // Use showGenericModal from modal_handler.js
    console.log("Calling showGenericModal...");
    showGenericModal(
      viewDetailsModal,
      `Checkout - ${customerName}`,
      modalContent,
      bookingDetailsContent
    );
    console.log("showGenericModal called successfully");
  }

  /**
   * Calculates the total amount, down payment, and balance for a booking.
   * Uses the same logic as the sales reports calculation.
   * @param {object} bookingData - The booking data from Firestore.
   * @returns {object} An object containing totalAmount, downPayment, and balance.
   */
  function calculateBookingAmounts(bookingData) {
    let totalAmount = 0;
    let petWeight = parseFloat(bookingData.petInformation?.petWeight);
    let petSize = getPetSizeCategory(petWeight);

    // Pricing based on pet size categories (same as sales reports)
    const sizePrices = {
      Small: 500,
      Medium: 600,
      Large: 700,
      XL: 800,
      XXL: 900,
      "N/A": 0,
    };

    if (bookingData.serviceType === "Boarding") {
      // Base price per day depends on pet size
      let dailyPrice = sizePrices[petSize] || 0;

      // Calculate total based on number of days
      const checkInDateStr =
        bookingData.boardingDetails?.checkInDate || bookingData.date;
      const checkOutDateStr = bookingData.boardingDetails?.checkOutDate;

      if (checkInDateStr && checkOutDateStr) {
        const checkInDate = new Date(checkInDateStr);
        const checkOutDate = new Date(checkOutDateStr);
        const diffTime = Math.abs(
          checkOutDate.getTime() - checkInDate.getTime()
        );
        const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalAmount = dailyPrice * Math.max(1, daysDiff); // Ensure at least 1 day
      } else {
        totalAmount = 0; // If dates are missing, total is 0
      }
    } else if (bookingData.serviceType === "Grooming") {
      // Grooming price also depends on pet size
      totalAmount = sizePrices[petSize] || 0;
    }

    // Get downPayment from bookingData.paymentDetails.downPaymentAmount if available, otherwise default to 0
    let actualDownPayment = parseFloat(
      bookingData.paymentDetails?.downPaymentAmount
    );
    if (isNaN(actualDownPayment)) {
      actualDownPayment = 0; // Default to 0 if not a valid number or not provided
    }

    // Balance is always totalAmount minus the actualDownPayment
    const balance = totalAmount - actualDownPayment;

    return { totalAmount, downPayment: actualDownPayment, balance, petSize };
  }

  /**
   * Determines the pet size category based on its weight in kilograms.
   * @param {number} weightKg - The pet's weight in kilograms.
   * @returns {string} The pet size category (Small, Medium, Large, XL, XXL).
   */
  function getPetSizeCategory(weightKg) {
    if (typeof weightKg !== "number" || isNaN(weightKg)) {
      return "N/A";
    }
    // Using simple weight categories for the sake of consistency with existing code's logic
    if (weightKg < 10) return "Small";
    if (weightKg >= 10.1 && weightKg <= 26) return "Medium";
    if (weightKg >= 26.1 && weightKg <= 34) return "Large";
    if (weightKg >= 34.1 && weightKg <= 38) return "XL";
    if (weightKg > 38) return "XXL";
    return "N/A"; // Fallback for weights outside defined ranges
  }

  // --- Real-Time Refresh Functions (Ensuring proper scope access to applyFilters) ---

  /**
   * Starts the real-time refresh functionality
   */
  function startRealTimeRefresh() {
    // Clear any existing interval
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }

    // Set up new interval to refresh every 30 seconds
    refreshInterval = setInterval(async () => {
      try {
        console.log("Auto-refreshing bookings data...");

        // applyFilters is accessible because this function is defined inside DOMContentLoaded
        await applyFilters();
      } catch (error) {
        console.error("Error during auto-refresh:", error);
      }
    }, 30000); // 30 seconds

    console.log("Real-time refresh started (every 30 seconds)");
  }

  /**
   * Stops the real-time refresh functionality
   */
  function stopRealTimeRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
      console.log("Real-time refresh stopped");
    }
  }

  /**
   * Restarts the real-time refresh functionality
   */
  function restartRealTimeRefresh() {
    stopRealTimeRefresh();
    startRealTimeRefresh();
  }

  // Start real-time refresh (every 30 seconds)
  startRealTimeRefresh();

  // Removed rejection monitoring - no longer needed

  // Initialize acceptance monitoring
  initializeAcceptanceMonitoring();
});
