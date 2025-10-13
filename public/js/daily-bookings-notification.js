// js/daily-bookings-notification.js

import { db } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";
import { showInfoNotification } from "./notification-modal.js";

/**
 * Checks for bookings scheduled for today and shows a notification to the admin
 */
export async function checkTodayBookings() {
  try {
    console.log("Checking for today's bookings...");

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayString = today.toISOString().split("T")[0];

    console.log("Checking bookings for date:", todayString);

    // Query for bookings with today's date
    const todayBookingsQuery = query(
      collection(db, "bookings"),
      where("date", "==", todayString)
    );

    const querySnapshot = await getDocs(todayBookingsQuery);
    console.log("Today's bookings found:", querySnapshot.size);

    if (querySnapshot.size > 0) {
      const todayBookings = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        todayBookings.push({
          id: doc.id,
          ...data,
        });
      });

      // Show notification with today's bookings
      await showTodayBookingsNotification(todayBookings);
    }
  } catch (error) {
    console.error("Error checking today's bookings:", error);
  }
}

/**
 * Shows a notification modal with today's bookings
 * @param {Array} bookings - Array of bookings scheduled for today
 */
async function showTodayBookingsNotification(bookings) {
  try {
    // Categorize bookings by status
    const pendingBookings = bookings.filter((b) => b.status === "Pending");
    const approvedBookings = bookings.filter((b) => b.status === "Approved");
    const checkedInBookings = bookings.filter((b) => b.status === "Check In");

    // Create notification content
    const notificationContent = `
      <div class="modal-section" style="background: #e2e3e5; padding: 25px; border-radius: 12px; margin-bottom: 20px; border-left: 5px solid #17a2b8;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 4em; color: #17a2b8; margin-bottom: 15px;">📅</div>
          <h3 style="color: #495057; margin: 0; font-size: 1.5em; font-weight: bold;">Today's Bookings</h3>
          <p style="color: #495057; margin: 10px 0 0 0; font-size: 1.1em;">You have ${bookings.length} booking${bookings.length !== 1 ? "s" : ""} scheduled for today.</p>
        </div>
      </div>

      <div class="modal-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #ffb64a; padding-bottom: 10px;">📊 Booking Summary</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 15px;">
          ${
            approvedBookings.length > 0
              ? `
          <div style="background: #d4edda; padding: 15px; border-radius: 6px; text-align: center; border-left: 4px solid #28a745;">
            <div style="font-size: 2em; color: #28a745; margin-bottom: 5px;">✅</div>
            <div style="font-weight: bold; color: #155724;">${approvedBookings.length}</div>
            <div style="font-size: 0.9em; color: #155724;">Ready for Check-in</div>
          </div>
          `
              : ""
          }
          
          ${
            pendingBookings.length > 0
              ? `
          <div style="background: #fff3cd; padding: 15px; border-radius: 6px; text-align: center; border-left: 4px solid #ffc107;">
            <div style="font-size: 2em; color: #856404; margin-bottom: 5px;">⏳</div>
            <div style="font-weight: bold; color: #856404;">${pendingBookings.length}</div>
            <div style="font-size: 0.9em; color: #856404;">Pending Review</div>
          </div>
          `
              : ""
          }
          
          ${
            checkedInBookings.length > 0
              ? `
          <div style="background: #d1ecf1; padding: 15px; border-radius: 6px; text-align: center; border-left: 4px solid #17a2b8;">
            <div style="font-size: 2em; color: #0c5460; margin-bottom: 5px;">🏠</div>
            <div style="font-weight: bold; color: #0c5460;">${checkedInBookings.length}</div>
            <div style="font-size: 0.9em; color: #0c5460;">Already Checked-in</div>
          </div>
          `
              : ""
          }
        </div>
      </div>

      <div class="modal-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #ffb64a; padding-bottom: 10px;">📋 Booking Details</h3>
        <div style="max-height: 300px; overflow-y: auto;">
          ${bookings
            .map((booking) => {
              const customerName = booking.ownerInformation
                ? `${booking.ownerInformation.firstName || ""} ${booking.ownerInformation.lastName || ""}`.trim()
                : "Unknown Customer";
              const petName = booking.petInformation?.petName || "Unknown Pet";
              const serviceType = booking.serviceType || "Unknown Service";

              // Get status badge styling
              let statusBadge = "";
              if (booking.status === "Approved") {
                statusBadge =
                  '<span style="background: #d4edda; color: #155724; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold;">✅ Approved</span>';
              } else if (booking.status === "Pending") {
                statusBadge =
                  '<span style="background: #fff3cd; color: #856404; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold;">⏳ Pending</span>';
              } else if (booking.status === "Check In") {
                statusBadge =
                  '<span style="background: #d1ecf1; color: #0c5460; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold;">🏠 Checked-in</span>';
              }

              return `
              <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 10px; border-left: 4px solid #ffb64a;">
                <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 8px;">
                  <div style="font-weight: bold; color: #333; flex: 1;">${customerName}</div>
                  <div>${statusBadge}</div>
                </div>
                <div style="color: #666; font-size: 0.9em; margin-bottom: 5px;">
                  <strong>Pet:</strong> ${petName} • <strong>Service:</strong> ${serviceType}
                </div>
              </div>
            `;
            })
            .join("")}
        </div>
      </div>

      ${
        approvedBookings.length > 0
          ? `
      <div class="modal-section" style="background: #d1ecf1; padding: 20px; border-radius: 8px; border-left: 4px solid #17a2b8;">
        <h3 style="color: #0c5460; margin-bottom: 15px; border-bottom: 2px solid #17a2b8; padding-bottom: 10px;">⚡ Action Required</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <p style="color: #0c5460; margin: 0; line-height: 1.6;">
            <strong>You have ${approvedBookings.length} booking${approvedBookings.length !== 1 ? "s" : ""} ready for check-in today!</strong><br>
            Please ensure you're prepared for their arrival and have all necessary documents ready.
          </p>
        </div>
      </div>
      `
          : ""
      }

      <div class="modal-section" style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
        <h3 style="color: #856404; margin-bottom: 15px; border-bottom: 2px solid #ffc107; padding-bottom: 10px;">💡 Tips</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <ul style="color: #856404; margin: 0; padding-left: 20px; line-height: 1.6;">
            <li>Review pending bookings in the "Pending Bookings" section</li>
            <li>Check approved bookings in the "Bookings" section for check-in</li>
            <li>Ensure vaccination records are verified before check-in</li>
            <li>Have payment information ready for checkout procedures</li>
          </ul>
        </div>
      </div>
    `;

    // Show the notification
    const modal =
      document.getElementById("viewDetailsModal") ||
      document.getElementById("detailsModal");
    const modalContentDiv =
      document.getElementById("bookingDetailsContent") ||
      document.getElementById("modalBody");

    if (modal && modalContentDiv) {
      // Show the modal content
      modalContentDiv.innerHTML = notificationContent;
      modal.style.display = "flex";
      document.getElementById("overlay").style.display = "block";

      // Update modal title
      const modalHeader = modal.querySelector(".modal-header h2");
      if (modalHeader) {
        modalHeader.textContent = `Today's Bookings - ${new Date().toLocaleDateString()}`;
      }

      // Create custom footer with close button
      const modalFooter = modal.querySelector(".modal-footer");
      if (modalFooter) {
        modalFooter.innerHTML = `
          <button id="closeTodayBookingsBtn" class="btn btn-primary">Got it!</button>
        `;

        // Add event listener
        document
          .getElementById("closeTodayBookingsBtn")
          .addEventListener("click", () => {
            modal.style.display = "none";
            document.getElementById("overlay").style.display = "none";
          });
      }

      // Add close functionality for X button and overlay
      const closeBtn = modal.querySelector("#modalCloseBtn");
      const overlay = document.getElementById("overlay");

      const closeModal = () => {
        modal.style.display = "none";
        overlay.style.display = "none";
      };

      if (closeBtn) closeBtn.onclick = closeModal;
      if (overlay)
        overlay.onclick = (e) => {
          if (e.target === overlay) closeModal();
        };
    } else {
      // Fallback to simple alert if modal elements not found
      const message =
        `You have ${bookings.length} booking${bookings.length !== 1 ? "s" : ""} scheduled for today:\n\n` +
        bookings
          .map((b) => {
            const customerName = b.ownerInformation
              ? `${b.ownerInformation.firstName || ""} ${b.ownerInformation.lastName || ""}`.trim()
              : "Unknown Customer";
            return `• ${customerName} (${b.status})`;
          })
          .join("\n");

      alert(message);
    }
  } catch (error) {
    console.error("Error showing today's bookings notification:", error);
  }
}

/**
 * Checks if the admin has already seen today's booking notification
 * @returns {boolean} True if already seen today, false otherwise
 */
function hasSeenTodayNotification() {
  const today = new Date().toDateString();
  const lastSeen = localStorage.getItem("lastBookingNotificationDate");
  return lastSeen === today;
}

/**
 * Marks today's notification as seen
 */
function markNotificationAsSeen() {
  const today = new Date().toDateString();
  localStorage.setItem("lastBookingNotificationDate", today);
}

/**
 * Main function to check and show today's bookings notification
 * Only shows if admin hasn't seen it today
 */
export async function checkAndShowTodayBookings() {
  try {
    // Only show notification if admin hasn't seen it today
    if (!hasSeenTodayNotification()) {
      await checkTodayBookings();
      markNotificationAsSeen();
    }
  } catch (error) {
    console.error("Error in checkAndShowTodayBookings:", error);
  }
}
