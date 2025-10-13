// js/bookings-approved.js
import { db } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";
import {
  showGenericModal,
  initializeModalCloseListeners,
} from "./modal_handler.js";
import {
  showSuccessNotification,
  showErrorNotification,
  showWarningNotification,
  showConfirmationModal,
  showAdminNotesModal,
  showCheckoutSuccessNotification,
  showCheckoutConfirmationModal,
} from "./notification-modal.js";
import {
  showRefreshIndicator,
  hideRefreshIndicator,
  showSuccessIndicator,
  showSuccessNotification as showToastSuccess,
} from "./realtime-indicator.js";
// Removed real-time rejection monitoring
import { initializeAcceptanceMonitoring } from "./realtime-acceptance-monitor.js";

// Global variables
let allApprovedBookingsData = {};
let currentStatusFilter = "All"; // Default filter to show all approved bookings
let refreshInterval; // Variable to store the refresh interval

// Test Firebase imports
console.log("Testing Firebase imports in bookings-approved.js:");
console.log("db:", db);
console.log("doc function:", typeof doc);
console.log("updateDoc function:", typeof updateDoc);

// DOM elements
const approvedBookingsTableBody = document.getElementById(
  "approvedBookingsTableBody"
);
const statusFilter = document.getElementById("statusFilter");
const refreshButton = document.getElementById("refreshBookingsBtn");

// Check if required elements exist
if (!approvedBookingsTableBody) {
  console.error("approvedBookingsTableBody not found!");
}

if (!refreshButton) {
  console.error(
    "refreshButton not found! Please add a button with id='refreshBookingsBtn' in your HTML."
  );
}

// Event listeners
if (refreshButton) {
  refreshButton.addEventListener("click", async () => {
    await renderApprovedBookingsTable();

    // Show refresh success notification
    showToastSuccess("Approved bookings refreshed successfully!");
  });
}

if (statusFilter) {
  statusFilter.addEventListener("change", () => {
    currentStatusFilter = statusFilter.value;
    console.log("Status filter changed to:", currentStatusFilter);
    renderApprovedBookingsTable();
  });
}

/**
 * Fetches all approved booking documents from the "bookings" collection in Firestore.
 * This function retrieves bookings with status "Approved", "Completed", or "Checked-Out".
 *
 * @returns {Promise<Array>} Array of approved booking objects
 */
const fetchApprovedBookingsFromFirestore = async () => {
  try {
    console.log("Fetching approved bookings from Firestore...");

    // Query for approved, checked-out, check-in, and extended bookings
    const approvedBookingsQuery = query(
      collection(db, "bookings"),
      where("status", "in", ["Approved", "Checked-Out", "Check In", "Extended"])
    );

    const querySnapshot = await getDocs(approvedBookingsQuery);
    console.log("Approved bookings query snapshot size:", querySnapshot.size);

    const bookings = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log("=== RAW BOOKING DATA ===");
      console.log("Document ID:", doc.id);
      console.log("Status:", data.status);
      console.log("Pet Information:", data.petInformation);
      console.log("Owner Information:", data.ownerInformation);
      console.log("Service Type:", data.serviceType);
      console.log("Date:", data.date);
      console.log("All data fields:", Object.keys(data));
      console.log("========================");
      bookings.push({ id: doc.id, ...data });
    });

    console.log("Approved bookings fetched:", bookings);
    return bookings;
  } catch (error) {
    console.error("Error fetching approved bookings:", error);
    return [];
  }
};

/**
 * Apply filters to approved bookings data
 * @param {Array} bookings - Array of all approved bookings
 * @returns {Array} Filtered bookings based on current filter
 */
const applyFilters = (bookings) => {
  let filteredBookings = bookings;

  // Apply status filter
  if (currentStatusFilter !== "All") {
    filteredBookings = bookings.filter(
      (booking) => booking.status === currentStatusFilter
    );
  }

  return filteredBookings;
};

/**
 * Renders the approved bookings table based on the current filter and fetched data.
 * Fetches all approved bookings, then filters them locally before rendering.
 */
const renderApprovedBookingsTable = async () => {
  try {
    const allFetchedBookings = await fetchApprovedBookingsFromFirestore();
    let filteredBookings = allFetchedBookings;

    // Apply filters
    filteredBookings = applyFilters(allFetchedBookings);
    console.log("=== FILTERING DEBUG ===");
    console.log("All fetched bookings:", allFetchedBookings.length);
    console.log("After filtering:", filteredBookings.length);
    console.log("Current status filter:", currentStatusFilter);
    console.log("Filtered bookings:", filteredBookings);
    console.log("======================");

    // Clear and populate table
    const approvedBookingsTableBody = document.getElementById(
      "approvedBookingsTableBody"
    );
    approvedBookingsTableBody.innerHTML = ""; // Clear existing rows

    if (filteredBookings.length === 0) {
      // If no approved bookings found, show a helpful message and suggest checking the database
      approvedBookingsTableBody.innerHTML = `
        <tr>
          <td colspan='9' style='text-align: center; padding: 20px;'>
            <div style='margin-bottom: 10px;'>No ${currentStatusFilter.toLowerCase()} approved bookings found.</div>
            <div style='font-size: 12px; color: #666;'>
              This could mean:<br>
              • No bookings have been approved yet<br>
              • All bookings are still pending<br>
              • Check the "Pending Bookings" page to approve some bookings
            </div>
          </td>
        </tr>
      `;
      return;
    }

    // Sort bookings: today's bookings first, then by date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    filteredBookings.sort((a, b) => {
      // Get check-in dates for comparison
      let dateA = null;
      let dateB = null;

      if (a.date) {
        try {
          dateA = a.date.toDate();
        } catch (e) {
          dateA = new Date(a.date);
        }
      }

      if (b.date) {
        try {
          dateB = b.date.toDate();
        } catch (e) {
          dateB = new Date(b.date);
        }
      }

      // Check if either is today
      const aIsToday =
        dateA &&
        dateA >= today &&
        dateA < new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const bIsToday =
        dateB &&
        dateB >= today &&
        dateB < new Date(today.getTime() + 24 * 60 * 60 * 1000);

      // Today's bookings first
      if (aIsToday && !bIsToday) return -1;
      if (!aIsToday && bIsToday) return 1;

      // Then sort by date (most recent first)
      if (dateA && dateB) {
        return dateB - dateA;
      }

      return 0;
    });

    // Store data globally for view details functionality
    const tempBookingsData = {};

    filteredBookings.forEach((booking) => {
      const row = document.createElement("tr");

      // Debug: Log all available fields for this booking
      console.log("=== BOOKING DEBUG ===");
      console.log("Booking ID:", booking.id);
      console.log("Available fields:", Object.keys(booking));
      console.log("Status:", booking.status);
      console.log("Pet Information:", booking.petInformation);
      console.log("Pet Name:", booking.petInformation?.petName);
      console.log("Owner Information:", booking.ownerInformation);
      console.log("Owner First Name:", booking.ownerInformation?.firstName);
      console.log("Owner Last Name:", booking.ownerInformation?.lastName);
      console.log("Service Type:", booking.serviceType);
      console.log("Date:", booking.date);
      console.log("Full booking data:", booking);
      console.log("===================");

      // Format check-in date using the actual 'date' field from the database
      let checkInDateStr = "N/A";
      let checkInDateObj = null;
      let isToday = false;
      const oneDay = 24 * 60 * 60 * 1000;

      if (booking.date) {
        try {
          checkInDateObj = booking.date.toDate(); // 1. Try Firestore Timestamp
        } catch (e) {
          try {
            checkInDateObj = new Date(booking.date); // 2. Try regular Date/ISO string
          } catch (e2) {
            checkInDateObj = null;
          }
        }
      }

      if (checkInDateObj && !isNaN(checkInDateObj.getTime())) {
        checkInDateStr = checkInDateObj.toLocaleDateString();
        isToday =
          checkInDateObj >= today &&
          checkInDateObj < new Date(today.getTime() + oneDay);
      } else {
        checkInDateStr = "N/A";
      }

      // Try to get check-out date from boarding details for duration calculation
      let checkOutDateObj = null;
      if (booking.boardingDetails?.checkOutDate) {
        try {
          checkOutDateObj = new Date(booking.boardingDetails.checkOutDate);
        } catch (e) {
          checkOutDateObj = null;
        }
      }

      // Format duration
      let duration = "N/A";
      if (booking.boardingDetails?.hourlyExtension) {
        duration = `${booking.boardingDetails.extensionHours} hours`;
      } else if (booking.duration) {
        duration = `${booking.duration} days`;
      } else if (booking.numberOfDays) {
        duration = `${booking.numberOfDays} days`;
      } else if (checkOutDateObj && checkInDateObj) {
        try {
          const diffTime = Math.abs(
            checkOutDateObj.getTime() - checkInDateObj.getTime()
          );
          // Calculate days difference and round up to include the last day
          const diffDays = Math.ceil(diffTime / oneDay);
          duration = `${diffDays} days`;
        } catch (e) {
          duration = "N/A";
        }
      }

      // Create status badge
      const statusBadge = `<span class="status-badge status-${booking.status ? booking.status.toLowerCase().replace(/[ -]/g, "-") : "unknown"}">${booking.status}</span>`;

      // Get customer information using the actual field names from the database
      const petName = booking.petInformation?.petName || "N/A";
      const ownerName = booking.ownerInformation
        ? `${booking.ownerInformation.firstName || ""} ${booking.ownerInformation.lastName || ""}`.trim()
        : "N/A";
      const serviceType = booking.serviceType || "N/A";
      const roomType = booking.boardingDetails?.selectedRoomType || "N/A";

      // Add today indicator and highlight row if it's today's booking
      const todayIndicator = isToday
        ? ' <span style="background: #ffb64a; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px; margin-left: 5px;">TODAY</span>'
        : "";
      const rowStyle = isToday
        ? "background-color: #fff3e0 !important; font-weight: 500;"
        : "";

      row.innerHTML = `
        <td style="${rowStyle}">${booking.bookingId || booking.id}</td>
        <td style="${rowStyle}">${petName}${todayIndicator}</td>
        <td style="${rowStyle}">${ownerName}</td>
        <td style="${rowStyle}">${serviceType}</td>
        <td style="${rowStyle}">${roomType}</td>
        <td style="${rowStyle}">${checkInDateStr}</td>
        <td style="${rowStyle}">${duration}</td>
        <td style="${rowStyle}">${statusBadge}</td>
        <td style="${rowStyle}">
          <button class="action-btn btn-view" data-id="${booking.id}">View</button>
          ${
            booking.status === "Approved"
              ? `<button class="action-btn btn-checkin" data-id="${booking.id}">Check In</button>`
              : ""
          }
          ${
            booking.status === "Check In"
              ? `<button class="action-btn btn-checkout" data-id="${booking.id}">Checkout</button>`
              : ""
          }
          ${
            booking.status === "Extended"
              ? `<button class="action-btn btn-checkout" data-id="${booking.id}">Checkout</button>`
              : ""
          }
        </td>
      `;

      approvedBookingsTableBody.appendChild(row);

      // Store booking data for view details
      tempBookingsData[booking.id] = booking;
    });

    allApprovedBookingsData = tempBookingsData; // Update global data reference for view details

    // Attach event listeners to action buttons
    attachActionButtonListeners();

    // Add summary row
    const summaryRow = document.createElement("tr");
    summaryRow.style.backgroundColor = "#f8f9fa";
    summaryRow.innerHTML = `
      <td colspan="9" style="text-align: center; padding: 15px; font-weight: bold; color: #666;">
        Total Approved Bookings: ${filteredBookings.length} | 
        Today's Bookings: ${
          filteredBookings.filter((b) => {
            if (b.date) {
              try {
                const date = b.date.toDate ? b.date.toDate() : new Date(b.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return (
                  date >= today &&
                  date < new Date(today.getTime() + 24 * 60 * 60 * 1000)
                );
              } catch (e) {
                return false;
              }
            }
            return false;
          }).length
        }
      </td>
    `;
    approvedBookingsTableBody.appendChild(summaryRow);
  } catch (error) {
    console.error("Error rendering approved bookings table:", error);
    const approvedBookingsTableBody = document.getElementById(
      "approvedBookingsTableBody"
    );
    approvedBookingsTableBody.innerHTML = `<tr><td colspan='9' style='text-align: center; padding: 20px; color: red;'>Error loading approved bookings</td></tr>`;
  }
};

/**
 * Attaches event listeners to action buttons
 */
function attachActionButtonListeners() {
  // Remove existing listeners to prevent duplicates
  document.querySelectorAll(".btn-view").forEach((btn) => {
    btn.removeEventListener("click", handleViewClick);
    btn.addEventListener("click", handleViewClick);
  });

  document.querySelectorAll(".btn-checkin").forEach((btn) => {
    btn.removeEventListener("click", handleCheckinClick);
    btn.addEventListener("click", handleCheckinClick);
  });

  document.querySelectorAll(".btn-checkout").forEach((btn) => {
    btn.removeEventListener("click", handleCheckoutClick);
    btn.addEventListener("click", handleCheckoutClick);
  });
}

/**
 * Handles view button click
 */
function handleViewClick(e) {
  const bookingId = e.target.getAttribute("data-id");
  viewApprovedBookingDetails(bookingId);
}

/**
 * Handles check-in button click
 */
function handleCheckinClick(e) {
  const bookingId = e.target.getAttribute("data-id");
  window.handleCheckinClick(bookingId);
}

/**
 * Handles checkout button click
 */
function handleCheckoutClick(e) {
  const bookingId = e.target.getAttribute("data-id");
  window.handleCheckoutClick(bookingId);
}

/**
 * View detailed information for a specific approved booking
 * @param {string} bookingId - The ID of the booking to view
 */
window.viewApprovedBookingDetails = async function (bookingId) {
  try {
    // Crucial step: Retrieving the stored data using the bookingId
    const booking = allApprovedBookingsData[bookingId];

    if (!booking) {
      console.error("Booking data not found for ID:", bookingId);
      return;
    }

    // --- Robust Date Parsing ---
    let checkInDate = "N/A";
    let checkOutDate = "N/A";
    let checkInDateObj = null;
    let checkOutDateObj = null;

    if (booking.date) {
      try {
        checkInDateObj = booking.date.toDate(); // 1. Try Firestore Timestamp
      } catch (e) {
        try {
          checkInDateObj = new Date(booking.date); // 2. Try regular Date/ISO string
        } catch (e2) {
          checkInDateObj = null;
        }
      }
      if (checkInDateObj && !isNaN(checkInDateObj.getTime())) {
        checkInDate = checkInDateObj.toLocaleDateString();
      }
    }

    // Try to get check-out date from boarding details
    if (booking.boardingDetails?.checkOutDate) {
      try {
        checkOutDateObj = new Date(booking.boardingDetails.checkOutDate);
      } catch (e) {
        checkOutDateObj = null;
      }
      if (checkOutDateObj && !isNaN(checkOutDateObj.getTime())) {
        checkOutDate = checkOutDateObj.toLocaleDateString();
      }
    }

    // Format duration
    let duration = "N/A";
    if (booking.boardingDetails?.hourlyExtension) {
      duration = `${booking.boardingDetails.extensionHours} hours`;
    } else if (booking.duration) {
      duration = `${booking.duration} days`;
    } else if (booking.numberOfDays) {
      duration = `${booking.numberOfDays} days`;
    } else if (checkOutDateObj && checkInDateObj) {
      try {
        const diffTime = Math.abs(
          checkOutDateObj.getTime() - checkInDateObj.getTime()
        );
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        duration = `${diffDays} days`;
      } catch (e) {
        duration = "N/A";
      }
    }
    // --- End Robust Date Parsing ---

    // Get customer information using the actual field names from the database
    const petName = booking.petInformation?.petName || "N/A";
    const ownerName = booking.ownerInformation
      ? `${booking.ownerInformation.firstName || ""} ${booking.ownerInformation.lastName || ""}`.trim()
      : "N/A";
    const serviceType = booking.serviceType || "N/A";
    const roomType = booking.boardingDetails?.selectedRoomType || "N/A";

    // FIX: Define customerName using ownerName to resolve the ReferenceError
    const customerName = ownerName;

    // Create modal content with standardized design matching pending bookings
    const modalContent = `
      <div class="modal-section">
        <h3>General Information</h3>
        <div class="info-item"><strong>Customer:</strong> <p>${customerName}</p></div>
        <div class="info-item"><strong>Service Type:</strong> <p>${serviceType}</p></div>
        <div class="info-item"><strong>Status:</strong> <p>${booking.status}</p></div>
        <div class="info-item"><strong>Check-in Date:</strong> <p>${checkInDate}</p></div>
        <div class="info-item"><strong>Check-out Date:</strong> <p>${checkOutDate}</p></div>
        <div class="info-item"><strong>Duration:</strong> <p>${duration}</p></div>
        <div class="info-item"><strong>Submitted On:</strong> <p>${booking.timestamp ? new Date(booking.timestamp.toDate()).toLocaleString() : "N/A"}</p></div>
      </div>

      <div class="modal-section">
        <h3>Owner Information</h3>
        <div class="info-item"><strong>Full Name:</strong> <p>${ownerName}</p></div>
        <div class="info-item"><strong>Email:</strong> <p>${booking.ownerInformation?.email || "N/A"}</p></div>
        <div class="info-item"><strong>Contact No:</strong> <p>${booking.ownerInformation?.contactNo || "N/A"}</p></div>
        <div class="info-item"><strong>Address:</strong> <p>${booking.ownerInformation?.address || "N/A"}</p></div>
      </div>

      <div class="modal-section">
        <h3>Pet Information</h3>
        <div class="info-item"><strong>Name:</strong> <p>${petName}</p></div>
        <div class="info-item"><strong>Type:</strong> <p>${booking.petInformation?.petType || "N/A"}</p></div>
        <div class="info-item"><strong>Breed:</strong> <p>${booking.petInformation?.petBreed || "N/A"}</p></div>
        <div class="info-item"><strong>Weight:</strong> <p>${booking.petInformation?.petWeight || "N/A"} kg</p></div>
        <div class="info-item"><strong>Age:</strong> <p>${booking.petInformation?.petAge || "N/A"}</p></div>
      </div>

      <div class="modal-section">
        <h3>Service Details</h3>
        <div class="info-item"><strong>Room Type:</strong> <p>${roomType}</p></div>
        <div class="info-item"><strong>Service Type:</strong> <p>${serviceType}</p></div>
        <div class="info-item"><strong>Check-in Date:</strong> <p>${checkInDate}</p></div>
        <div class="info-item"><strong>Check-out Date:</strong> <p>${checkOutDate}</p></div>
        <div class="info-item"><strong>Duration:</strong> <p>${duration}</p></div>
      </div>

      <div class="modal-section">
        <h3>Payment Details</h3>
        <div class="info-item"><strong>Method:</strong> <p>${booking.paymentDetails?.method || "N/A"}</p></div>
        <div class="info-item"><strong>Account No:</strong> <p>${booking.paymentDetails?.accountNumber || "N/A"}</p></div>
        <div class="info-item"><strong>Account Name:</strong> <p>${booking.paymentDetails?.accountName || "N/A"}</p></div>
        <div class="info-item"><strong>Total Amount:</strong> <p>₱${booking.totalAmount || "N/A"}</p></div>
        <div class="info-item"><strong>Down Payment:</strong> <p>₱${booking.downPayment || "N/A"}</p></div>
        <div class="info-item"><strong>Balance:</strong> <p>₱${booking.balance || "N/A"}</p></div>
      </div>

      <div class="modal-section">
        <h3>Admin Notes</h3>
        <p>${Array.isArray(booking.adminNotes) ? booking.adminNotes.join("<br>") : booking.adminNotes || "No notes provided."}</p>
      </div>
    `;

    // Get modal elements
    const modal = document.getElementById("detailsModal");
    const modalContentDiv = document.getElementById("modalBody");

    if (modal && modalContentDiv) {
      // Use showGenericModal from modal_handler.js
      showGenericModal(
        modal,
        `Booking Details: ${booking.bookingId || booking.id}`,
        modalContent,
        modalContentDiv
      );
    } else {
      console.error("Modal elements not found!");
      alert(
        "Error: Modal elements not found. Please refresh the page and try again."
      );
    }
  } catch (error) {
    console.error("Error viewing approved booking details:", error);
    alert("Error loading booking details. Please try again.");
  }
};

/**
 * Handles the check-in button click for approved bookings
 * @param {string} bookingId - The ID of the booking to check in
 */
window.handleCheckinClick = async function (bookingId) {
  console.log("Check-in button clicked for booking:", bookingId);

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
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, {
        status: "Check In",
        adminNotes: adminNotes ? [adminNotes] : [],
        updatedAt: new Date(),
      });

      console.log(`Booking ${bookingId} has been checked in.`);
      showSuccessNotification(
        "Pet Checked In Successfully",
        `Booking ${bookingId} has been checked in successfully!`,
        "The pet is now officially checked into the facility and the booking status has been updated.",
        "🏠"
      );

      // Refresh the table to show the updated status
      renderApprovedBookingsTable();
    } catch (error) {
      console.error("Error updating booking status:", error);
      showErrorNotification(
        "Check-in Failed",
        "Failed to update booking status: " + error.message,
        "Please check your internet connection and try again.",
        "❌"
      );
    }
  }
};

/**
 * Handles the checkout button click for approved bookings
 * @param {string} bookingId - The ID of the booking to checkout
 */
window.handleCheckoutClick = async function (bookingId) {
  console.log("Checkout button clicked for booking:", bookingId);
  try {
    const booking = allApprovedBookingsData[bookingId];

    if (!booking) {
      console.error("Booking data not found for ID:", bookingId);
      alert("Booking data not found!");
      return;
    }

    // Calculate balance using the same logic as the main bookings page
    // NOTE: This call now uses the fixed logic to calculate amounts based on actual stay duration.
    const { totalAmount, downPayment, balance } =
      calculateBookingAmounts(booking);

    // Get customer name
    const customerName = booking.ownerInformation
      ? `${booking.ownerInformation.firstName || ""} ${booking.ownerInformation.lastName || ""}`.trim()
      : "N/A";

    // Create modal content with enhanced styling
    const modalContent = `
      <div class="modal-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #ffb64a; padding-bottom: 10px;">🐾 Pet Checkout Information</h3>
        <div class="info-item" style="margin-bottom: 10px;"><strong>Customer:</strong> <span style="font-weight: normal; color: #666;">${customerName}</span></div>
        <div class="info-item" style="margin-bottom: 10px;"><strong>Pet Name:</strong> <span style="font-weight: normal; color: #666;">${booking.petInformation?.petName || "N/A"}</span></div>
        <div class="info-item" style="margin-bottom: 10px;"><strong>Service Type:</strong> <span style="font-weight: normal; color: #666;">${booking.serviceType || "N/A"}</span></div>
        <div class="info-item" style="margin-bottom: 10px;"><strong>Room Type:</strong> <span style="font-weight: normal; color: #666;">${booking.boardingDetails?.selectedRoomType || "N/A"}</span></div>
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
          <span style="font-weight: normal; color: #666; float: right;">${booking.paymentDetails?.method || "N/A"}</span>
        </div>
      </div>

      <div class="modal-section" style="background: #e2e3e5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #495057; margin-bottom: 15px; border-bottom: 2px solid #6c757d; padding-bottom: 10px;">📅 Stay Information</h3>
        <div class="info-item" style="margin-bottom: 10px;"><strong>Check-in Date:</strong> <span style="font-weight: normal; color: #666;">${booking.boardingDetails?.checkInDate || booking.date || "N/A"}</span></div>
        <div class="info-item" style="margin-bottom: 10px;"><strong>Check-out Date:</strong> <span style="font-weight: normal; color: #666;">${booking.boardingDetails?.checkOutDate || "N/A"}</span></div>
        <div class="info-item" style="margin-bottom: 10px;"><strong>Pet Size Category:</strong> <span style="font-weight: normal; color: #666;">${getPetSizeCategory(parseFloat(booking.petInformation?.petWeight))}</span></div>
        <div class="info-item" style="margin-bottom: 10px;"><strong>Pet Weight:</strong> <span style="font-weight: normal; color: #666;">${booking.petInformation?.petWeight || "N/A"} kg</span></div>
      </div>

      <div class="modal-section" style="background: #d1ecf1; padding: 20px; border-radius: 8px; text-align: center;">
        <h3 style="color: #0c5460; margin-bottom: 15px;">✅ Ready for Checkout</h3>
        <p style="color: #0c5460; font-size: 1.1em; margin: 0;">Please collect the remaining balance of <strong style="color: #dc3545;">₱${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> from the customer.</p>
        <p style="color: #28a745; font-weight: bold; margin: 10px 0; font-size: 0.9em;">⚠️ **Action Note:** Confirming checkout requires payment collection and will update the booking status to 'Checked-Out' and the payment status to 'Paid'.</p>
        <div style="margin-top: 20px;">
          <button id="confirmCheckoutBtn" style="background: #28a745; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 1.1em; font-weight: bold; cursor: pointer; margin-right: 10px;">
            ✅ Confirm Checkout
          </button>
          <button id="extendCheckoutBtn" style="background: #ffb64a; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 1.1em; font-weight: bold; cursor: pointer; margin-right: 10px;">
            ⏩ Extension
          </button>
          <button id="cancelCheckoutBtn" style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 1.1em; font-weight: bold; cursor: pointer;">
            ❌ Cancel
          </button>
        </div>
      </div>
    `;

    // Get modal elements
    const modal = document.getElementById("detailsModal");
    const modalContentDiv = document.getElementById("modalBody");

    console.log("Modal elements found:", {
      modal: !!modal,
      modalContentDiv: !!modalContentDiv,
    });

    if (modal && modalContentDiv) {
      // Update modal content
      modalContentDiv.innerHTML = modalContent;

      // Show modal
      modal.style.display = "flex";
      document.getElementById("overlay").style.display = "block";

      // Update modal title
      const modalHeader = modal.querySelector("#modalHeader");
      if (modalHeader) {
        modalHeader.textContent = `Pet Checkout - ${customerName}`;
      }

      // Add close functionality
      const closeBtn = modal.querySelector("#modalCloseBtn");
      const closeFooterBtn = modal.querySelector("#modalCloseBtnFooter");
      const overlay = document.getElementById("overlay");

      const closeModal = () => {
        modal.style.display = "none";
        overlay.style.display = "none";
      };

      if (closeBtn) closeBtn.onclick = closeModal;
      if (closeFooterBtn) closeFooterBtn.onclick = closeModal;
      if (overlay) overlay.onclick = closeModal;

      // Add checkout button event listeners
      const confirmCheckoutBtn = document.getElementById("confirmCheckoutBtn");
      const extendCheckoutBtn = document.getElementById("extendCheckoutBtn");
      const cancelCheckoutBtn = document.getElementById("cancelCheckoutBtn");

      if (confirmCheckoutBtn) {
        confirmCheckoutBtn.onclick = async () => {
          try {
            console.log("Checkout button clicked for booking:", bookingId);
            await handleConfirmCheckout(bookingId, booking);
            closeModal();
          } catch (error) {
            console.error("Error confirming checkout:", error);
            console.error("Full error object:", error);
            alert(
              `Error confirming checkout: ${error.message || "Unknown error occurred"}`
            );
          }
        };
      }

      if (extendCheckoutBtn) {
        extendCheckoutBtn.onclick = () => {
          try {
            console.log("Extension button clicked for booking:", bookingId);
            openExtensionModal(bookingId, booking);
          } catch (error) {
            console.error("Error opening extension modal:", error);
            alert(
              `Error: ${error.message || "Unable to open extension modal"}`
            );
          }
        };
      }

      if (cancelCheckoutBtn) {
        cancelCheckoutBtn.onclick = closeModal;
      }
    } else {
      alert("Modal elements not found!");
    }
  } catch (error) {
    console.error("Error showing checkout modal:", error);
    alert("Error loading checkout information. Please try again.");
  }
};

/**
 * Handles the confirmation of checkout for a booking
 * @param {string} bookingId - The ID of the booking to checkout
 * @param {object} booking - The booking data
 */
async function handleConfirmCheckout(bookingId, booking) {
  try {
    console.log("Confirming checkout for booking:", bookingId);
    console.log("Booking data:", booking);

    if (!bookingId) {
      throw new Error("Booking ID is required");
    }

    if (!booking) {
      throw new Error("Booking data is required");
    }

    // Show confirmation modal first
    const confirmed = await showCheckoutConfirmationModal(bookingId, booking);

    if (!confirmed) {
      console.log("Checkout cancelled by user");
      return; // User cancelled, don't proceed with checkout
    }

    console.log("User confirmed checkout, proceeding with checkout process...");

    // Update the booking status to "Checked-Out"
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      console.log("Updating booking:", bookingId, "to status: Checked-Out");
      console.log("Booking reference:", bookingRef);
      console.log("Database instance:", db);

      // Update both status and payment details
      const updateData = {
        status: "Checked-Out",
        updatedAt: new Date(),
      };

      // Also update payment status to "Paid" since customer has checked out
      if (booking.paymentDetails) {
        updateData.paymentDetails = {
          ...booking.paymentDetails,
          paymentStatus: "Paid",
        };
      } else {
        updateData.paymentDetails = {
          paymentStatus: "Paid",
        };
      }

      // If this was an extended booking, mark it as completed
      if (booking.status === "Extended") {
        updateData.extended = true; // Keep the extended flag
        updateData.extensionCompleted = true; // Mark extension as completed
      }

      await updateDoc(bookingRef, updateData);
      console.log("Booking updated successfully");
    } catch (firebaseError) {
      console.error("Firebase update error:", firebaseError);
      console.error("Error code:", firebaseError.code);
      console.error("Error message:", firebaseError.message);
      throw new Error(
        `Firebase update failed: ${firebaseError.message} (Code: ${firebaseError.code})`
      );
    }

    // Show success notification modal
    const isExtended = booking.status === "Extended";
    await showCheckoutSuccessNotification(bookingId, booking, isExtended);

    // Refresh the table to reflect the changes
    await renderApprovedBookingsTable();

    // Refresh sales reports if we're on the sales reports page
    if (window.refreshSalesReports) {
      window.refreshSalesReports();
    }
  } catch (error) {
    console.error("Error confirming checkout:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Handles the Extension action: immediately marks booking as Checked-Out and records extension flag
 * @param {string} bookingId
 * @param {object} booking
 */
async function handleExtendCheckout(bookingId, booking) {
  try {
    if (!bookingId) throw new Error("Booking ID is required");

    const bookingRef = doc(db, "bookings", bookingId);

    const updateData = {
      status: "Checked-Out",
      updatedAt: new Date(),
      extended: true,
    };

    // Ensure payment marked as Paid on extension as well
    if (booking.paymentDetails) {
      updateData.paymentDetails = {
        ...booking.paymentDetails,
        paymentStatus: "Paid",
      };
    } else {
      updateData.paymentDetails = { paymentStatus: "Paid" };
    }

    await updateDoc(bookingRef, updateData);

    alert("✅ Booking marked as Checked-Out and Extended.");

    // Refresh the table and sales reports if available
    await renderApprovedBookingsTable();
    if (window.refreshSalesReports) window.refreshSalesReports();
  } catch (error) {
    console.error("Error handling extension:", error);
    throw error;
  }
}

/**
 * Opens an inline extension modal content to set new schedule, then updates booking as Extended
 * @param {string} bookingId
 * @param {object} booking
 */
function openExtensionModal(bookingId, booking) {
  const modal = document.getElementById("detailsModal");
  const modalContentDiv = document.getElementById("modalBody");

  const currentCheckIn =
    booking.boardingDetails?.checkInDate || booking.date || "";
  const currentCheckOut = booking.boardingDetails?.checkOutDate || "";

  const content = `
    <div class="modal-section" style="background:#f8f9fa; padding:16px; border-radius:8px;">
      <h3 style="margin:0 0 12px 0;">Set Extension Schedule</h3>
      <div class="info-item">
        <strong>Current Check-in:</strong>
        <p>${currentCheckIn || "N/A"}</p>
      </div>
      <div class="info-item">
        <strong>Current Check-out:</strong>
        <p>${currentCheckOut || "N/A"}</p>
      </div>
      
      <div class="info-item">
        <strong>Extension Type:</strong>
        <p>
          <label style="display:inline-flex; align-items:center; margin-right:20px;">
            <input type="radio" name="extensionType" value="daily" checked style="margin-right:8px;">
            Daily Extension
          </label>
          <label style="display:inline-flex; align-items:center;">
            <input type="radio" name="extensionType" value="hourly" style="margin-right:8px;">
            Hourly Extension
          </label>
        </p>
      </div>
      
      <div id="dailyExtension" class="extension-option">
        <div class="info-item">
          <strong>New Check-in Date</strong>
          <p><input id="extCheckIn" type="date" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px;" /></p>
        </div>
        <div class="info-item">
          <strong>New Check-out Date</strong>
          <p><input id="extCheckOut" type="date" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px;" /></p>
        </div>
      </div>
      
      <div id="hourlyExtension" class="extension-option" style="display:none;">
        <div class="info-item">
          <strong>Extension Hours</strong>
          <p><input id="extHours" type="number" min="1" max="24" value="1" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px;" placeholder="Enter hours (1-24)" /></p>
        </div>
        <div class="info-item">
          <strong>Current Check-out Time</strong>
          <p><input id="currentCheckOutTime" type="time" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px;" /></p>
        </div>
      </div>
      
      <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:12px;">
        <button id="saveExtensionBtn" class="action-btn btn-primary">Save Extension</button>
        <button id="cancelExtensionBtn" class="action-btn btn-secondary">Cancel</button>
      </div>
    </div>
  `;

  if (modal && modalContentDiv) {
    modalContentDiv.innerHTML = content;
    modal.style.display = "flex";
    document.getElementById("overlay").style.display = "block";

    const saveBtn = document.getElementById("saveExtensionBtn");
    const cancelBtn = document.getElementById("cancelExtensionBtn");
    const dailyRadio = document.querySelector(
      'input[name="extensionType"][value="daily"]'
    );
    const hourlyRadio = document.querySelector(
      'input[name="extensionType"][value="hourly"]'
    );
    const dailyExtension = document.getElementById("dailyExtension");
    const hourlyExtension = document.getElementById("hourlyExtension");

    // Handle radio button switching
    if (dailyRadio) {
      dailyRadio.onchange = () => {
        dailyExtension.style.display = "block";
        hourlyExtension.style.display = "none";
      };
    }

    if (hourlyRadio) {
      hourlyRadio.onchange = () => {
        dailyExtension.style.display = "none";
        hourlyExtension.style.display = "block";
      };
    }

    // Set current time for hourly extension
    const currentTime = new Date().toTimeString().slice(0, 5);
    const currentTimeInput = document.getElementById("currentCheckOutTime");
    if (currentTimeInput) {
      currentTimeInput.value = currentTime;
    }

    const closeModal = () => {
      modal.style.display = "none";
      document.getElementById("overlay").style.display = "none";
    };

    if (cancelBtn) cancelBtn.onclick = closeModal;
    if (saveBtn) {
      saveBtn.onclick = async () => {
        const extensionType = document.querySelector(
          'input[name="extensionType"]:checked'
        )?.value;

        if (extensionType === "daily") {
          const newIn = /** @type {HTMLInputElement} */ (
            document.getElementById("extCheckIn")
          ).value;
          const newOut = /** @type {HTMLInputElement} */ (
            document.getElementById("extCheckOut")
          ).value;

          if (!newIn || !newOut) {
            alert("Please select both new check-in and check-out dates.");
            return;
          }
          if (new Date(newOut) < new Date(newIn)) {
            alert("Check-out date must be on or after the check-in date.");
            return;
          }

          try {
            await saveExtension(bookingId, booking, newIn, newOut, "daily");
            closeModal();
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } catch (e) {
            console.error("Error saving extension:", e);
            alert(`Failed to save extension: ${e.message || e}`);
          }
        } else if (extensionType === "hourly") {
          const hours = /** @type {HTMLInputElement} */ (
            document.getElementById("extHours")
          ).value;
          const currentTime = /** @type {HTMLInputElement} */ (
            document.getElementById("currentCheckOutTime")
          ).value;

          if (!hours || !currentTime) {
            alert("Please enter extension hours and current check-out time.");
            return;
          }

          const hoursNum = parseInt(hours);
          if (hoursNum < 1 || hoursNum > 24) {
            alert("Extension hours must be between 1 and 24.");
            return;
          }

          try {
            await saveHourlyExtension(
              bookingId,
              booking,
              hoursNum,
              currentTime
            );
            closeModal();
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } catch (e) {
            console.error("Error saving hourly extension:", e);
            alert(`Failed to save hourly extension: ${e.message || e}`);
          }
        }
      };
    }
  } else {
    alert("Modal elements not found.");
  }
}

/**
 * Saves extension to Firestore: update dates, mark status Extended, keep financials paid if applicable
 */
async function saveExtension(
  bookingId,
  booking,
  newCheckInISO,
  newCheckOutISO,
  extensionType = "daily"
) {
  try {
    console.log("Saving extension for booking:", bookingId);
    console.log("New check-in:", newCheckInISO);
    console.log("New check-out:", newCheckOutISO);

    const bookingRef = doc(db, "bookings", bookingId);

    const updatedBoarding = {
      ...(booking.boardingDetails || {}),
      checkInDate: newCheckInISO,
      checkOutDate: newCheckOutISO,
    };

    const updateData = {
      status: "Extended",
      updatedAt: new Date(),
      extended: true,
      boardingDetails: updatedBoarding,
    };

    console.log("Updating booking with data:", updateData);
    await updateDoc(bookingRef, updateData);
    console.log("Extension saved successfully");

    alert("✅ Extension saved. Booking marked as Extended.");

    // Refresh the table to show updated status
    await renderApprovedBookingsTable();

    // Also refresh sales reports if available
    if (window.refreshSalesReports) {
      window.refreshSalesReports();
    }
  } catch (error) {
    console.error("Error saving extension:", error);
    alert(`Failed to save extension: ${error.message || error}`);
    throw error;
  }
}

/**
 * Saves hourly extension to Firestore: calculate new check-out time, mark status Extended
 */
async function saveHourlyExtension(bookingId, booking, hours, currentTime) {
  try {
    console.log("Saving hourly extension for booking:", bookingId);
    console.log("Extension hours:", hours);
    console.log("Current time:", currentTime);

    const bookingRef = doc(db, "bookings", bookingId);

    // Calculate new check-out time
    const currentDate = new Date();
    const [hoursStr, minutesStr] = currentTime.split(":");
    currentDate.setHours(parseInt(hoursStr), parseInt(minutesStr), 0, 0);

    const newCheckOutTime = new Date(
      currentDate.getTime() + hours * 60 * 60 * 1000
    );
    const newCheckOutISO = newCheckOutTime.toISOString().split("T")[0];
    const newCheckOutTimeStr = newCheckOutTime.toTimeString().slice(0, 5);

    const updatedBoarding = {
      ...(booking.boardingDetails || {}),
      checkOutDate: newCheckOutISO,
      checkOutTime: newCheckOutTimeStr,
      hourlyExtension: true,
      extensionHours: hours,
    };

    const updateData = {
      status: "Extended",
      updatedAt: new Date(),
      extended: true,
      extensionType: "hourly",
      boardingDetails: updatedBoarding,
    };

    console.log("Updating booking with hourly extension data:", updateData);
    await updateDoc(bookingRef, updateData);
    console.log("Hourly extension saved successfully");

    alert(
      `✅ Hourly extension saved. Booking extended by ${hours} hour(s). New check-out time: ${newCheckOutTimeStr}`
    );

    // Refresh the table to show updated status
    await renderApprovedBookingsTable();

    // Also refresh sales reports if available
    if (window.refreshSalesReports) {
      window.refreshSalesReports();
    }
  } catch (error) {
    console.error("Error saving hourly extension:", error);
    alert(`Failed to save hourly extension: ${error.message || error}`);
    throw error;
  }
}

/**
 * Calculates the total amount, down payment, and balance for a booking.
 * @param {object} bookingData - The booking data from Firestore.
 * @returns {object} An object containing totalAmount, downPayment, and balance.
 */
function calculateBookingAmounts(bookingData) {
  let totalAmount = 0;
  let petWeight = parseFloat(bookingData.petInformation?.petWeight);
  let petSize = getPetSizeCategory(petWeight);

  // Pricing based on pet size categories
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

    // --- START OF FIX: Calculate actual days stayed for accurate billing on early checkout ---

    const checkInDateStr =
      bookingData.boardingDetails?.checkInDate || bookingData.date;

    if (checkInDateStr) {
      // 1. Determine the Check-in Date
      let checkInDate;
      try {
        checkInDate = checkInDateStr.toDate(); // Attempt to convert Firestore Timestamp
      } catch (e) {
        checkInDate = new Date(checkInDateStr); // Fallback to convert ISO string
      }
      checkInDate.setHours(0, 0, 0, 0); // Normalize to start of day for accurate day calculation

      // 2. Determine the Effective Checkout Date (Today)
      // This is the date the checkout button is pressed.
      const effectiveCheckOutDate = new Date();
      // Set to end of the day to ensure the current day is fully counted
      effectiveCheckOutDate.setHours(23, 59, 59, 999);

      // 3. Calculate ACTUAL days stayed
      const diffTime = Math.abs(
        effectiveCheckOutDate.getTime() - checkInDate.getTime()
      );

      // Calculate days difference and round up (standard boarding practice)
      let daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // 4. Ensure minimum charge of 1 day
      const actualDaysStayed = Math.max(1, daysDiff);

      // 5. Calculate New Total Amount
      totalAmount = dailyPrice * actualDaysStayed;

      console.log(`Boarding Billing Fix Debug:`);
      console.log(`Daily Price (${petSize}): ₱${dailyPrice.toFixed(2)}`);
      console.log(`Check In: ${checkInDate.toLocaleDateString()}`);
      console.log(
        `Effective Checkout (Today): ${effectiveCheckOutDate.toLocaleDateString()}`
      );
      console.log(`Actual Days Charged: ${actualDaysStayed}`);
      console.log(`Calculated Total Amount: ₱${totalAmount.toFixed(2)}`);
    } else {
      totalAmount = 0; // If dates are missing, total is 0
    }

    // --- END OF FIX ---
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
  if (weightKg < 10) return "Small";
  if (weightKg >= 11 && weightKg <= 26) return "Medium";
  if (weightKg >= 27 && weightKg <= 34) return "Large";
  if (weightKg >= 34 && weightKg <= 38) return "XL";
  if (weightKg > 38) return "XXL";
  return "N/A"; // Fallback for weights outside defined ranges
}

// Initial load of approved bookings table
renderApprovedBookingsTable();

// Start real-time refresh (every 30 seconds)
startRealTimeRefresh();

// Removed rejection monitoring - no longer needed

// Initialize acceptance monitoring
initializeAcceptanceMonitoring();

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
      console.log("Auto-refreshing approved bookings data...");

      await renderApprovedBookingsTable();

      // No notification needed for auto-refresh
    } catch (error) {
      console.error("Error during auto-refresh:", error);
    }
  }, 30000); // 30 seconds

  console.log(
    "Real-time refresh started for approved bookings (every 30 seconds)"
  );
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
