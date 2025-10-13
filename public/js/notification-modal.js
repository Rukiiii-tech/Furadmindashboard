// js/notification-modal.js

import { showGenericModal } from "./modal_handler.js";

/**
 * Shows a success notification modal
 * @param {string} title - The title of the notification
 * @param {string} message - The main message
 * @param {string} details - Optional additional details
 * @param {string} icon - Optional icon (emoji or HTML)
 */
export function showSuccessNotification(
  title,
  message,
  details = "",
  icon = "✅"
) {
  const notificationContent = `
    <div class="modal-section" style="background: #d4edda; padding: 25px; border-radius: 12px; margin-bottom: 20px; border-left: 5px solid #28a745;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 4em; color: #28a745; margin-bottom: 15px;">${icon}</div>
        <h3 style="color: #155724; margin: 0; font-size: 1.5em; font-weight: bold;">${title}</h3>
        <p style="color: #155724; margin: 10px 0 0 0; font-size: 1.1em;">${message}</p>
      </div>
    </div>
    ${
      details
        ? `
    <div class="modal-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #ffb64a; padding-bottom: 10px;">📋 Details</h3>
      <div style="background: white; padding: 15px; border-radius: 6px;">
        <p style="color: #495057; margin: 0; line-height: 1.6;">${details}</p>
      </div>
    </div>
    `
        : ""
    }
  `;

  const modal =
    document.getElementById("viewDetailsModal") ||
    document.getElementById("detailsModal");
  const modalContentDiv =
    document.getElementById("bookingDetailsContent") ||
    document.getElementById("modalBody");

  if (modal && modalContentDiv) {
    showGenericModal(modal, title, notificationContent, modalContentDiv);
  } else {
    console.error("Modal elements not found for success notification!");
    alert(`${title}\n\n${message}${details ? "\n\n" + details : ""}`);
  }
}

/**
 * Shows an error notification modal
 * @param {string} title - The title of the notification
 * @param {string} message - The main message
 * @param {string} details - Optional additional details
 * @param {string} icon - Optional icon (emoji or HTML)
 */
export function showErrorNotification(
  title,
  message,
  details = "",
  icon = "❌"
) {
  const notificationContent = `
    <div class="modal-section" style="background: #f8d7da; padding: 25px; border-radius: 12px; margin-bottom: 20px; border-left: 5px solid #dc3545;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 4em; color: #dc3545; margin-bottom: 15px;">${icon}</div>
        <h3 style="color: #721c24; margin: 0; font-size: 1.5em; font-weight: bold;">${title}</h3>
        <p style="color: #721c24; margin: 10px 0 0 0; font-size: 1.1em;">${message}</p>
      </div>
    </div>
    ${
      details
        ? `
    <div class="modal-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #ffb64a; padding-bottom: 10px;">📋 Error Details</h3>
      <div style="background: white; padding: 15px; border-radius: 6px;">
        <p style="color: #495057; margin: 0; line-height: 1.6;">${details}</p>
      </div>
    </div>
    `
        : ""
    }
  `;

  const modal =
    document.getElementById("viewDetailsModal") ||
    document.getElementById("detailsModal");
  const modalContentDiv =
    document.getElementById("bookingDetailsContent") ||
    document.getElementById("modalBody");

  if (modal && modalContentDiv) {
    showGenericModal(modal, title, notificationContent, modalContentDiv);
  } else {
    console.error("Modal elements not found for error notification!");
    alert(`${title}\n\n${message}${details ? "\n\n" + details : ""}`);
  }
}

/**
 * Shows a warning notification modal
 * @param {string} title - The title of the notification
 * @param {string} message - The main message
 * @param {string} details - Optional additional details
 * @param {string} icon - Optional icon (emoji or HTML)
 */
export function showWarningNotification(
  title,
  message,
  details = "",
  icon = "⚠️"
) {
  const notificationContent = `
    <div class="modal-section" style="background: #fff3cd; padding: 25px; border-radius: 12px; margin-bottom: 20px; border-left: 5px solid #ffc107;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 4em; color: #856404; margin-bottom: 15px;">${icon}</div>
        <h3 style="color: #856404; margin: 0; font-size: 1.5em; font-weight: bold;">${title}</h3>
        <p style="color: #856404; margin: 10px 0 0 0; font-size: 1.1em;">${message}</p>
      </div>
    </div>
    ${
      details
        ? `
    <div class="modal-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #ffb64a; padding-bottom: 10px;">📋 Details</h3>
      <div style="background: white; padding: 15px; border-radius: 6px;">
        <p style="color: #495057; margin: 0; line-height: 1.6;">${details}</p>
      </div>
    </div>
    `
        : ""
    }
  `;

  const modal =
    document.getElementById("viewDetailsModal") ||
    document.getElementById("detailsModal");
  const modalContentDiv =
    document.getElementById("bookingDetailsContent") ||
    document.getElementById("modalBody");

  if (modal && modalContentDiv) {
    showGenericModal(modal, title, notificationContent, modalContentDiv);
  } else {
    console.error("Modal elements not found for warning notification!");
    alert(`${title}\n\n${message}${details ? "\n\n" + details : ""}`);
  }
}

/**
 * Shows an info notification modal
 * @param {string} title - The title of the notification
 * @param {string} message - The main message
 * @param {string} details - Optional additional details
 * @param {string} icon - Optional icon (emoji or HTML)
 */
export function showInfoNotification(
  title,
  message,
  details = "",
  icon = "ℹ️"
) {
  const notificationContent = `
    <div class="modal-section" style="background: #d1ecf1; padding: 25px; border-radius: 12px; margin-bottom: 20px; border-left: 5px solid #17a2b8;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 4em; color: #0c5460; margin-bottom: 15px;">${icon}</div>
        <h3 style="color: #0c5460; margin: 0; font-size: 1.5em; font-weight: bold;">${title}</h3>
        <p style="color: #0c5460; margin: 10px 0 0 0; font-size: 1.1em;">${message}</p>
      </div>
    </div>
    ${
      details
        ? `
    <div class="modal-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #ffb64a; padding-bottom: 10px;">📋 Details</h3>
      <div style="background: white; padding: 15px; border-radius: 6px;">
        <p style="color: #495057; margin: 0; line-height: 1.6;">${details}</p>
      </div>
    </div>
    `
        : ""
    }
  `;

  const modal =
    document.getElementById("viewDetailsModal") ||
    document.getElementById("detailsModal");
  const modalContentDiv =
    document.getElementById("bookingDetailsContent") ||
    document.getElementById("modalBody");

  if (modal && modalContentDiv) {
    showGenericModal(modal, title, notificationContent, modalContentDiv);
  } else {
    console.error("Modal elements not found for info notification!");
    alert(`${title}\n\n${message}${details ? "\n\n" + details : ""}`);
  }
}

/**
 * Shows a confirmation modal with custom buttons
 * @param {string} title - The title of the confirmation
 * @param {string} message - The main message
 * @param {string} confirmText - Text for confirm button
 * @param {string} cancelText - Text for cancel button
 * @param {string} details - Optional additional details
 * @param {string} icon - Optional icon (emoji or HTML)
 * @returns {Promise<boolean>} Resolves to true if confirmed, false if cancelled
 */
export function showConfirmationModal(
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  details = "",
  icon = "❓"
) {
  return new Promise((resolve) => {
    const notificationContent = `
      <div class="modal-section" style="background: #e2e3e5; padding: 25px; border-radius: 12px; margin-bottom: 20px; border-left: 5px solid #6c757d;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 4em; color: #495057; margin-bottom: 15px;">${icon}</div>
          <h3 style="color: #495057; margin: 0; font-size: 1.5em; font-weight: bold;">${title}</h3>
          <p style="color: #495057; margin: 10px 0 0 0; font-size: 1.1em;">${message}</p>
        </div>
      </div>
      ${
        details
          ? `
      <div class="modal-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #ffb64a; padding-bottom: 10px;">📋 Details</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <p style="color: #495057; margin: 0; line-height: 1.6;">${details}</p>
        </div>
      </div>
      `
          : ""
      }
    `;

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
        modalHeader.textContent = title;
      }

      // Create custom footer with confirm/cancel buttons
      const modalFooter = modal.querySelector(".modal-footer");
      if (modalFooter) {
        modalFooter.innerHTML = `
          <button id="confirmBtn" class="btn btn-primary" style="margin-right: 10px;">${confirmText}</button>
          <button id="cancelBtn" class="btn btn-secondary">${cancelText}</button>
        `;

        // Add event listeners
        document.getElementById("confirmBtn").addEventListener("click", () => {
          modal.style.display = "none";
          document.getElementById("overlay").style.display = "none";
          resolve(true);
        });

        document.getElementById("cancelBtn").addEventListener("click", () => {
          modal.style.display = "none";
          document.getElementById("overlay").style.display = "none";
          resolve(false);
        });
      }

      // Add close functionality for X button and overlay
      const closeBtn = modal.querySelector("#modalCloseBtn");
      const overlay = document.getElementById("overlay");

      const closeModal = () => {
        modal.style.display = "none";
        overlay.style.display = "none";
        resolve(false);
      };

      if (closeBtn) closeBtn.onclick = closeModal;
      if (overlay)
        overlay.onclick = (e) => {
          if (e.target === overlay) closeModal();
        };
    } else {
      console.error("Modal elements not found for confirmation modal!");
      resolve(
        confirm(`${title}\n\n${message}${details ? "\n\n" + details : ""}`)
      );
    }
  });
}

/**
 * Shows a modal for collecting admin notes input
 * @param {string} title - The title of the input modal
 * @param {string} placeholder - Placeholder text for the input
 * @param {string} buttonText - Text for the submit button
 * @returns {Promise<string|null>} Resolves to the entered text or null if cancelled
 */
export function showAdminNotesModal(
  title = "Add Admin Notes",
  placeholder = "Enter your notes here...",
  buttonText = "Save Notes"
) {
  return new Promise((resolve) => {
    const notificationContent = `
      <div class="modal-section" style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin-bottom: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 3em; color: #ffb64a; margin-bottom: 15px;">📝</div>
          <h3 style="color: #333; margin: 0; font-size: 1.4em; font-weight: bold;">${title}</h3>
          <p style="color: #666; margin: 10px 0 0 0; font-size: 1em;">Add any relevant notes or comments for this action.</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
          <label for="adminNotesInput" style="display: block; margin-bottom: 10px; font-weight: 600; color: #333;">
            Admin Notes:
          </label>
          <textarea 
            id="adminNotesInput" 
            rows="4" 
            placeholder="${placeholder}"
            style="
              width: 100%; 
              padding: 12px; 
              border: 2px solid #e9ecef; 
              border-radius: 6px; 
              font-size: 1em; 
              font-family: inherit; 
              resize: vertical; 
              min-height: 100px;
              transition: border-color 0.3s ease;
              box-sizing: border-box;
            "
            onfocus="this.style.borderColor='#ffb64a'; this.style.outline='none';"
            onblur="this.style.borderColor='#e9ecef';"
          ></textarea>
          <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
            💡 <strong>Tip:</strong> These notes will be visible to other administrators and help track important information about this booking.
          </div>
        </div>
      </div>
    `;

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
        modalHeader.textContent = title;
      }

      // Create custom footer with save/cancel buttons
      const modalFooter = modal.querySelector(".modal-footer");
      if (modalFooter) {
        modalFooter.innerHTML = `
          <button id="saveNotesBtn" class="btn btn-primary" style="margin-right: 10px;">${buttonText}</button>
          <button id="cancelNotesBtn" class="btn btn-secondary">Cancel</button>
        `;

        // Add event listeners
        document
          .getElementById("saveNotesBtn")
          .addEventListener("click", () => {
            const notesInput = document.getElementById("adminNotesInput");
            const notes = notesInput ? notesInput.value.trim() : "";

            modal.style.display = "none";
            document.getElementById("overlay").style.display = "none";
            resolve(notes);
          });

        document
          .getElementById("cancelNotesBtn")
          .addEventListener("click", () => {
            modal.style.display = "none";
            document.getElementById("overlay").style.display = "none";
            resolve(null);
          });
      }

      // Add close functionality for X button and overlay
      const closeBtn = modal.querySelector("#modalCloseBtn");
      const overlay = document.getElementById("overlay");

      const closeModal = () => {
        modal.style.display = "none";
        overlay.style.display = "none";
        resolve(null);
      };

      if (closeBtn) closeBtn.onclick = closeModal;
      if (overlay)
        overlay.onclick = (e) => {
          if (e.target === overlay) closeModal();
        };

      // Focus on the textarea when modal opens
      setTimeout(() => {
        const notesInput = document.getElementById("adminNotesInput");
        if (notesInput) {
          notesInput.focus();
        }
      }, 100);

      // Add Enter key support (Ctrl+Enter to save)
      document.addEventListener("keydown", function handleKeydown(e) {
        if (e.ctrlKey && e.key === "Enter") {
          e.preventDefault();
          const saveBtn = document.getElementById("saveNotesBtn");
          if (saveBtn) saveBtn.click();
        } else if (e.key === "Escape") {
          e.preventDefault();
          const cancelBtn = document.getElementById("cancelNotesBtn");
          if (cancelBtn) cancelBtn.click();
        }
      });

      // Remove event listener when modal closes
      const originalSaveBtn = document.getElementById("saveNotesBtn");
      const originalCancelBtn = document.getElementById("cancelNotesBtn");

      if (originalSaveBtn) {
        originalSaveBtn.addEventListener("click", () => {
          document.removeEventListener("keydown", handleKeydown);
        });
      }

      if (originalCancelBtn) {
        originalCancelBtn.addEventListener("click", () => {
          document.removeEventListener("keydown", handleKeydown);
        });
      }
    } else {
      console.error("Modal elements not found for admin notes modal!");
      resolve(prompt(`${title}\n\n${placeholder}`));
    }
  });
}

/**
 * Shows a dedicated modal for booking rejection with predefined reasons
 * @param {string} bookingId - The ID of the booking being rejected
 * @param {string} customerName - The name of the customer
 * @param {string} petName - The name of the pet
 * @returns {Promise<{reason: string}|null>} Resolves to rejection data or null if cancelled
 */
export function showBookingRejectionModal(bookingId, customerName, petName) {
  return new Promise((resolve) => {
    const rejectionContent = `
      <div class="modal-section" style="background: #f8d7da; padding: 25px; border-radius: 12px; margin-bottom: 20px; border-left: 5px solid #dc3545;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 4em; color: #dc3545; margin-bottom: 15px;">❌</div>
          <h3 style="color: #721c24; margin: 0; font-size: 1.5em; font-weight: bold;">Reject Booking</h3>
          <p style="color: #721c24; margin: 10px 0 0 0; font-size: 1.1em;">Please provide a reason for rejecting this booking.</p>
        </div>
      </div>

      <div class="modal-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #ffb64a; padding-bottom: 10px;">📋 Booking Information</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px;">
            <div><strong>Customer:</strong> ${customerName}</div>
            <div><strong>Pet Name:</strong> ${petName}</div>
          </div>
        </div>
      </div>

      <div class="modal-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #ffb64a; padding-bottom: 10px;">🚫 Rejection Reason</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <label for="rejectionReason" style="display: block; margin-bottom: 10px; font-weight: 600; color: #333;">
            Select a reason for rejection:
          </label>
          <select id="rejectionReason" style="
            width: 100%; 
            padding: 12px; 
            border: 2px solid #e9ecef; 
            border-radius: 6px; 
            font-size: 1em; 
            background: white;
            transition: border-color 0.3s ease;
            box-sizing: border-box;
            margin-bottom: 15px;
          " onfocus="this.style.borderColor='#ffb64a'; this.style.outline='none';" onblur="this.style.borderColor='#e9ecef';">
            <option value="">Select a reason...</option>
            <option value="vaccination-missing">Missing or Invalid Vaccination Record</option>
            <option value="incomplete-information">Incomplete Booking Information</option>
            <option value="capacity-full">No Available Capacity</option>
            <option value="unsuitable-pet">Pet Not Suitable for Service</option>
            <option value="behavior-concerns">Pet Behavior Concerns</option>
            <option value="health-issues">Pet Health Issues</option>
            <option value="owner-compliance">Owner Non-Compliance</option>
            <option value="payment-issues">Payment or Deposit Issues</option>
            <option value="schedule-conflict">Schedule Conflict</option>
            <option value="policy-violation">Policy Violation</option>
            <option value="other">Other (Specify in notes)</option>
          </select>
          <div style="font-size: 0.9em; color: #666; background: #e9ecef; padding: 10px; border-radius: 4px;">
            💡 <strong>Note:</strong> The selected reason will be included in the rejection notification sent to the customer.
          </div>
        </div>
      </div>


      <div class="modal-section" style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
        <h3 style="color: #856404; margin-bottom: 15px; border-bottom: 2px solid #ffc107; padding-bottom: 10px;">⚠️ Important</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <p style="color: #856404; margin: 0; line-height: 1.6;">
            <strong>Before rejecting this booking, please ensure:</strong><br>
            • You have reviewed all booking details thoroughly<br>
            • The rejection reason is valid and documented<br>
            • The customer will be notified of the rejection<br>
            • This action cannot be easily undone
          </p>
        </div>
      </div>
    `;

    const modal =
      document.getElementById("viewDetailsModal") ||
      document.getElementById("detailsModal");
    const modalContentDiv =
      document.getElementById("bookingDetailsContent") ||
      document.getElementById("modalBody");

    if (modal && modalContentDiv) {
      // Show the modal content
      modalContentDiv.innerHTML = rejectionContent;
      modal.style.display = "flex";
      document.getElementById("overlay").style.display = "block";

      // Update modal title
      const modalHeader = modal.querySelector(".modal-header h2");
      if (modalHeader) {
        modalHeader.textContent = `Reject Booking - ${customerName}`;
      }

      // Create custom footer with reject/cancel buttons
      const modalFooter = modal.querySelector(".modal-footer");
      if (modalFooter) {
        modalFooter.innerHTML = `
          <button id="rejectBookingBtn" class="btn btn-danger" style="margin-right: 10px; background: #dc3545; border-color: #dc3545;">Reject Booking</button>
          <button id="cancelRejectionBtn" class="btn btn-secondary">Cancel</button>
        `;

        // Add event listeners
        document
          .getElementById("rejectBookingBtn")
          .addEventListener("click", () => {
            const reasonSelect = document.getElementById("rejectionReason");

            const reason = reasonSelect ? reasonSelect.value : "";

            // Validate that a reason is selected
            if (!reason) {
              showWarningNotification(
                "Reason Required",
                "Please select a reason for rejecting this booking.",
                "A rejection reason is required to proceed with the rejection.",
                "⚠️"
              );
              return;
            }

            modal.style.display = "none";
            document.getElementById("overlay").style.display = "none";
            resolve({ reason });
          });

        document
          .getElementById("cancelRejectionBtn")
          .addEventListener("click", () => {
            modal.style.display = "none";
            document.getElementById("overlay").style.display = "none";
            resolve(null);
          });
      }

      // Add close functionality for X button and overlay
      const closeBtn = modal.querySelector("#modalCloseBtn");
      const overlay = document.getElementById("overlay");

      const closeModal = () => {
        modal.style.display = "none";
        overlay.style.display = "none";
        resolve(null);
      };

      if (closeBtn) closeBtn.onclick = closeModal;
      if (overlay)
        overlay.onclick = (e) => {
          if (e.target === overlay) closeModal();
        };

      // Focus on the reason select when modal opens
      setTimeout(() => {
        const reasonSelect = document.getElementById("rejectionReason");
        if (reasonSelect) {
          reasonSelect.focus();
        }
      }, 100);

      // Add keyboard support
      document.addEventListener("keydown", function handleKeydown(e) {
        if (e.key === "Escape") {
          e.preventDefault();
          const cancelBtn = document.getElementById("cancelRejectionBtn");
          if (cancelBtn) cancelBtn.click();
        }
      });

      // Remove event listener when modal closes
      const originalRejectBtn = document.getElementById("rejectBookingBtn");
      const originalCancelBtn = document.getElementById("cancelRejectionBtn");

      if (originalRejectBtn) {
        originalRejectBtn.addEventListener("click", () => {
          document.removeEventListener("keydown", handleKeydown);
        });
      }

      if (originalCancelBtn) {
        originalCancelBtn.addEventListener("click", () => {
          document.removeEventListener("keydown", handleKeydown);
        });
      }
    } else {
      console.error("Modal elements not found for booking rejection modal!");
      const reason = prompt("Enter rejection reason:");
      resolve(reason ? { reason } : null);
    }
  });
}

/**
 * Shows a success notification modal for checkout confirmation
 * @param {string} bookingId - The ID of the checked out booking
 * @param {object} booking - The booking data
 * @param {boolean} isExtended - Whether this was an extended booking
 */
export function showCheckoutSuccessNotification(
  bookingId,
  booking,
  isExtended = false
) {
  return new Promise((resolve) => {
    // Get customer and pet information
    const customerName = booking.ownerInformation
      ? `${booking.ownerInformation.firstName || ""} ${booking.ownerInformation.lastName || ""}`.trim()
      : "Unknown Customer";

    const petName = booking.petInformation?.petName || "Unknown Pet";
    const serviceType = booking.serviceType || "Unknown Service";

    // Calculate payment information
    const { totalAmount, downPayment, balance } =
      calculateBookingAmounts(booking);

    // Format dates
    let checkInDate = "N/A";
    let checkOutDate = "N/A";

    if (booking.date) {
      try {
        checkInDate = new Date(booking.date.toDate()).toLocaleDateString();
      } catch (e) {
        checkInDate = new Date(booking.date).toLocaleDateString();
      }
    }

    if (booking.boardingDetails?.checkOutDate) {
      try {
        checkOutDate = new Date(
          booking.boardingDetails.checkOutDate
        ).toLocaleDateString();
      } catch (e) {
        checkOutDate = "N/A";
      }
    }

    const notificationContent = `
      <div class="modal-section" style="background: #d4edda; padding: 25px; border-radius: 12px; margin-bottom: 20px; border-left: 5px solid #28a745;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 4em; color: #28a745; margin-bottom: 15px;">✅</div>
          <h3 style="color: #155724; margin: 0; font-size: 1.5em; font-weight: bold;">Checkout Completed Successfully!</h3>
          <p style="color: #155724; margin: 10px 0 0 0; font-size: 1.1em;">${isExtended ? "Extended booking checkout confirmed!" : "The booking has been successfully checked out and payment collected."}</p>
        </div>
      </div>

      <div class="modal-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #ffb64a; padding-bottom: 10px;">📋 Booking Information</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px;">
            <div><strong>Customer:</strong> ${customerName}</div>
            <div><strong>Pet Name:</strong> ${petName}</div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px;">
            <div><strong>Service Type:</strong> ${serviceType}</div>
            <div><strong>Check-in Date:</strong> ${checkInDate}</div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div><strong>Check-out Date:</strong> ${checkOutDate}</div>
            <div><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">✅ Checked Out</span></div>
          </div>
        </div>
      </div>

      <div class="modal-section" style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
        <h3 style="color: #856404; margin-bottom: 15px; border-bottom: 2px solid #ffc107; padding-bottom: 10px;">💰 Payment Summary</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px; background: #f8f9fa; border-radius: 4px;">
            <span><strong>Total Amount:</strong></span>
            <span style="font-weight: bold; color: #333;">₱${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px; background: #f8f9fa; border-radius: 4px;">
            <span><strong>Down Payment:</strong></span>
            <span style="font-weight: bold; color: #17a2b8;">₱${downPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 12px; background: #d4edda; border-radius: 4px; border: 2px solid #28a745;">
            <span style="font-weight: bold; color: #155724; font-size: 1.1em;">Balance Collected:</span>
            <span style="font-weight: bold; color: #28a745; font-size: 1.2em;">₱${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <div class="modal-section" style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #0c5460; margin-bottom: 15px; border-bottom: 2px solid #17a2b8; padding-bottom: 10px;">✅ Status Updates</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div style="padding: 10px; background: #d4edda; border-radius: 6px; border-left: 4px solid #28a745;">
              <strong style="color: #155724;">Booking Status:</strong><br>
              <span style="color: #155724;">✅ Checked-Out</span>
            </div>
            <div style="padding: 10px; background: #d4edda; border-radius: 6px; border-left: 4px solid #28a745;">
              <strong style="color: #155724;">Payment Status:</strong><br>
              <span style="color: #155724;">✅ Paid</span>
            </div>
          </div>
          ${
            isExtended
              ? `
          <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 6px; border-left: 4px solid #ffc107;">
            <strong style="color: #856404;">Extension Status:</strong><br>
            <span style="color: #856404;">✅ Extension Completed</span>
          </div>
          `
              : ""
          }
        </div>
      </div>

      <div class="modal-section" style="background: #e2e3e5; padding: 20px; border-radius: 8px; text-align: center;">
        <h3 style="color: #495057; margin-bottom: 15px;">🎉 Transaction Complete</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <p style="color: #495057; margin: 0; line-height: 1.6; font-size: 1.05em;">
            <strong>Great job!</strong> The customer has been successfully checked out and all payments have been collected. 
            The booking is now complete and will be reflected in your sales reports.
          </p>
        </div>
      </div>
    `;

    const modal = document.getElementById("detailsModal");
    const modalContentDiv = document.getElementById("modalBody");

    if (modal && modalContentDiv) {
      // Show the modal content
      modalContentDiv.innerHTML = notificationContent;
      modal.style.display = "flex";
      document.getElementById("overlay").style.display = "block";

      // Update modal title
      const modalHeader = modal.querySelector(".modal-header h2");
      if (modalHeader) {
        modalHeader.textContent = `Checkout Complete - ${customerName}`;
      }

      // Create custom footer with close button
      const modalFooter = modal.querySelector(".modal-footer");
      if (modalFooter) {
        modalFooter.innerHTML = `
          <button id="closeCheckoutSuccessBtn" class="btn btn-primary">Got it!</button>
        `;

        // Add event listener
        document
          .getElementById("closeCheckoutSuccessBtn")
          .addEventListener("click", () => {
            modal.style.display = "none";
            document.getElementById("overlay").style.display = "none";
            resolve();
          });
      }

      // Add close functionality for X button and overlay
      const closeBtn = modal.querySelector("#modalCloseBtn");
      const overlay = document.getElementById("overlay");

      const closeModal = () => {
        modal.style.display = "none";
        overlay.style.display = "none";
        resolve();
      };

      if (closeBtn) closeBtn.onclick = closeModal;
      if (overlay)
        overlay.onclick = (e) => {
          if (e.target === overlay) closeModal();
        };
    } else {
      console.error(
        "Modal elements not found for checkout success notification!"
      );
      // Fallback to alert if modal elements not found
      const message = isExtended
        ? "✅ Extended booking checkout confirmed successfully! The booking status has been updated to 'Checked-Out' and payment status has been marked as 'Paid'."
        : "✅ Checkout confirmed successfully! The booking status has been updated to 'Checked-Out' and payment status has been marked as 'Paid'.";
      alert(message);
      resolve();
    }
  });
}

/**
 * Helper function to calculate booking amounts (copied from bookings-approved.js)
 * @param {object} bookingData - The booking data
 * @returns {object} An object containing totalAmount, downPayment, and balance
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

    // Calculate total based on number of days
    const checkInDateStr =
      bookingData.boardingDetails?.checkInDate || bookingData.date;
    const checkOutDateStr = bookingData.boardingDetails?.checkOutDate;

    if (checkInDateStr && checkOutDateStr) {
      const checkInDate = new Date(checkInDateStr);
      const checkOutDate = new Date(checkOutDateStr);
      const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
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
 * Shows a confirmation modal before processing checkout
 * @param {string} bookingId - The ID of the booking to checkout
 * @param {object} booking - The booking data
 * @returns {Promise<boolean>} - Returns true if confirmed, false if cancelled
 */
export function showCheckoutConfirmationModal(bookingId, booking) {
  return new Promise((resolve) => {
    // Get customer and pet information
    const customerName = booking.ownerInformation
      ? `${booking.ownerInformation.firstName || ""} ${booking.ownerInformation.lastName || ""}`.trim()
      : "Unknown Customer";

    const petName = booking.petInformation?.petName || "Unknown Pet";
    const serviceType = booking.serviceType || "Unknown Service";

    // Calculate payment information
    const { totalAmount, downPayment, balance } =
      calculateBookingAmounts(booking);

    // Format dates
    let checkInDate = "N/A";
    let checkOutDate = "N/A";

    if (booking.date) {
      try {
        checkInDate = new Date(booking.date.toDate()).toLocaleDateString();
      } catch (e) {
        checkInDate = new Date(booking.date).toLocaleDateString();
      }
    }

    if (booking.boardingDetails?.checkOutDate) {
      try {
        checkOutDate = new Date(
          booking.boardingDetails.checkOutDate
        ).toLocaleDateString();
      } catch (e) {
        checkOutDate = "N/A";
      }
    }

    const isExtended = booking.status === "Extended";

    const confirmationContent = `
      <div class="modal-section" style="background: #fff3cd; padding: 25px; border-radius: 12px; margin-bottom: 20px; border-left: 5px solid #ffc107;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 4em; color: #ffc107; margin-bottom: 15px;">⚠️</div>
          <h3 style="color: #856404; margin: 0; font-size: 1.5em; font-weight: bold;">Confirm Checkout</h3>
          <p style="color: #856404; margin: 10px 0 0 0; font-size: 1.1em;">Are you sure you want to checkout this booking? This action will mark the booking as 'Checked-Out' and payment as 'Paid'.</p>
        </div>
      </div>

      <div class="modal-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #ffb64a; padding-bottom: 10px;">📋 Booking Information</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px;">
            <div><strong>Customer:</strong> ${customerName}</div>
            <div><strong>Pet Name:</strong> ${petName}</div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px;">
            <div><strong>Service Type:</strong> ${serviceType}</div>
            <div><strong>Check-in Date:</strong> ${checkInDate}</div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div><strong>Check-out Date:</strong> ${checkOutDate}</div>
            <div><strong>Status:</strong> <span style="color: #007bff; font-weight: bold;">📋 Ready for Checkout</span></div>
          </div>
          ${
            isExtended
              ? `
          <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 6px; border-left: 4px solid #ffc107;">
            <strong style="color: #856404;">Extension Status:</strong><br>
            <span style="color: #856404;">📅 Extended Booking</span>
          </div>
          `
              : ""
          }
        </div>
      </div>

      <div class="modal-section" style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
        <h3 style="color: #856404; margin-bottom: 15px; border-bottom: 2px solid #ffc107; padding-bottom: 10px;">💰 Payment Summary</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px; background: #f8f9fa; border-radius: 4px;">
            <span><strong>Total Amount:</strong></span>
            <span style="font-weight: bold; color: #333;">₱${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px; background: #f8f9fa; border-radius: 4px;">
            <span><strong>Down Payment:</strong></span>
            <span style="font-weight: bold; color: #17a2b8;">₱${downPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 12px; background: #d1ecf1; border-radius: 4px; border: 2px solid #17a2b8;">
            <span style="font-weight: bold; color: #0c5460; font-size: 1.1em;">Balance to Collect:</span>
            <span style="font-weight: bold; color: #17a2b8; font-size: 1.2em;">₱${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <div class="modal-section" style="background: #f8d7da; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc3545;">
        <h3 style="color: #721c24; margin-bottom: 15px; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">⚠️ Important</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <p style="color: #721c24; margin: 0; line-height: 1.6;">
            <strong>Before confirming checkout, please ensure:</strong><br>
            • Payment has been collected from the customer<br>
            • All services have been completed<br>
            • Pet is ready to be returned to the owner<br>
            • All belongings have been returned<br>
            • This action will update the booking status to 'Checked-Out'<br>
            • Payment status will be marked as 'Paid'
          </p>
        </div>
      </div>

      <div class="modal-section" style="background: #e2e3e5; padding: 20px; border-radius: 8px; text-align: center;">
        <h3 style="color: #495057; margin-bottom: 15px;">🤔 Ready to Proceed?</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <p style="color: #495057; margin: 0; line-height: 1.6; font-size: 1.05em;">
            <strong>Are you ready to complete the checkout process for ${customerName}?</strong><br>
            This will finalize the booking and mark all payments as collected.
          </p>
        </div>
      </div>
    `;

    const modal = document.getElementById("detailsModal");
    const modalContentDiv = document.getElementById("modalBody");

    if (modal && modalContentDiv) {
      // Show the modal content
      modalContentDiv.innerHTML = confirmationContent;
      modal.style.display = "flex";
      document.getElementById("overlay").style.display = "block";

      // Update modal title
      const modalHeader = modal.querySelector(".modal-header h2");
      if (modalHeader) {
        modalHeader.textContent = `Confirm Checkout - ${customerName}`;
      }

      // Create custom footer with confirm and cancel buttons
      const modalFooter = modal.querySelector(".modal-footer");
      if (modalFooter) {
        modalFooter.innerHTML = `
          <button id="confirmCheckoutFinalBtn" class="btn btn-success" style="margin-right: 10px;">
            ✅ Confirm Checkout
          </button>
          <button id="cancelCheckoutBtn" class="btn btn-secondary">
            ❌ Cancel
          </button>
        `;

        // Add event listeners
        document
          .getElementById("confirmCheckoutFinalBtn")
          .addEventListener("click", () => {
            modal.style.display = "none";
            document.getElementById("overlay").style.display = "none";
            resolve(true); // User confirmed
          });

        document
          .getElementById("cancelCheckoutBtn")
          .addEventListener("click", () => {
            modal.style.display = "none";
            document.getElementById("overlay").style.display = "none";
            resolve(false); // User cancelled
          });
      }

      // Add close functionality for X button and overlay (treat as cancel)
      const closeBtn = modal.querySelector("#modalCloseBtn");
      const overlay = document.getElementById("overlay");

      const closeModal = () => {
        modal.style.display = "none";
        overlay.style.display = "none";
        resolve(false); // Treat closing as cancellation
      };

      if (closeBtn) closeBtn.onclick = closeModal;
      if (overlay)
        overlay.onclick = (e) => {
          if (e.target === overlay) closeModal();
        };

      // Add keyboard support
      const handleKeydown = (e) => {
        if (e.key === "Escape") {
          closeModal();
        } else if (e.key === "Enter" && e.ctrlKey) {
          // Ctrl+Enter to confirm
          e.preventDefault();
          document.getElementById("confirmCheckoutFinalBtn").click();
        }
      };

      document.addEventListener("keydown", handleKeydown);

      // Clean up event listener when modal closes
      const originalConfirmBtn = document.getElementById(
        "confirmCheckoutFinalBtn"
      );
      const originalCancelBtn = document.getElementById("cancelCheckoutBtn");

      if (originalConfirmBtn) {
        originalConfirmBtn.addEventListener("click", () => {
          document.removeEventListener("keydown", handleKeydown);
        });
      }

      if (originalCancelBtn) {
        originalCancelBtn.addEventListener("click", () => {
          document.removeEventListener("keydown", handleKeydown);
        });
      }
    } else {
      console.error(
        "Modal elements not found for checkout confirmation modal!"
      );
      // Fallback to confirm dialog if modal elements not found
      const confirmed = confirm(
        `Are you sure you want to checkout booking ${bookingId} for ${customerName}?`
      );
      resolve(confirmed);
    }
  });
}

/**
 * Shows a success notification modal for booking rejection
 * @param {string} bookingId - The ID of the rejected booking
 * @param {object} booking - The booking data
 * @param {string} rejectionReason - The reason for rejection
 */
export function showBookingRejectionSuccessNotification(
  bookingId,
  booking,
  rejectionReason
) {
  return new Promise((resolve) => {
    // Get customer and pet information
    const customerName = booking.ownerInformation
      ? `${booking.ownerInformation.firstName || ""} ${booking.ownerInformation.lastName || ""}`.trim()
      : "Unknown Customer";

    const petName = booking.petInformation?.petName || "Unknown Pet";
    const serviceType = booking.serviceType || "Unknown Service";

    // Format dates
    let bookingDate = "N/A";
    if (booking.date) {
      try {
        bookingDate = new Date(booking.date.toDate()).toLocaleDateString();
      } catch (e) {
        bookingDate = new Date(booking.date).toLocaleDateString();
      }
    }

    const notificationContent = `
      <div class="modal-section" style="background: #f8d7da; padding: 25px; border-radius: 12px; margin-bottom: 20px; border-left: 5px solid #dc3545;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 4em; color: #dc3545; margin-bottom: 15px;">❌</div>
          <h3 style="color: #721c24; margin: 0; font-size: 1.5em; font-weight: bold;">Booking Rejected Successfully!</h3>
          <p style="color: #721c24; margin: 10px 0 0 0; font-size: 1.1em;">The booking has been rejected and the customer will be notified.</p>
        </div>
      </div>

      <div class="modal-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #ffb64a; padding-bottom: 10px;">📋 Booking Information</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px;">
            <div><strong>Customer:</strong> ${customerName}</div>
            <div><strong>Pet Name:</strong> ${petName}</div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px;">
            <div><strong>Service Type:</strong> ${serviceType}</div>
            <div><strong>Booking Date:</strong> ${bookingDate}</div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div><strong>Status:</strong> <span style="color: #dc3545; font-weight: bold;">❌ Rejected</span></div>
            <div><strong>Customer Notification:</strong> <span style="color: #17a2b8; font-weight: bold;">📧 Will be notified</span></div>
          </div>
        </div>
      </div>

      <div class="modal-section" style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
        <h3 style="color: #856404; margin-bottom: 15px; border-bottom: 2px solid #ffc107; padding-bottom: 10px;">📝 Rejection Details</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <div style="padding: 12px; background: #f8f9fa; border-radius: 4px; border-left: 4px solid #dc3545;">
            <strong style="color: #721c24;">Rejection Reason:</strong><br>
            <span style="color: #721c24; font-size: 1.05em;">${rejectionReason}</span>
          </div>
        </div>
      </div>

      <div class="modal-section" style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #0c5460; margin-bottom: 15px; border-bottom: 2px solid #17a2b8; padding-bottom: 10px;">✅ Status Updates</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div style="padding: 10px; background: #f8d7da; border-radius: 6px; border-left: 4px solid #dc3545;">
              <strong style="color: #721c24;">Booking Status:</strong><br>
              <span style="color: #721c24;">❌ Rejected</span>
            </div>
            <div style="padding: 10px; background: #d1ecf1; border-radius: 6px; border-left: 4px solid #17a2b8;">
              <strong style="color: #0c5460;">Customer Notification:</strong><br>
              <span style="color: #0c5460;">📧 Will be notified</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-section" style="background: #e2e3e5; padding: 20px; border-radius: 8px; text-align: center;">
        <h3 style="color: #495057; margin-bottom: 15px;">📋 Next Steps</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <p style="color: #495057; margin: 0; line-height: 1.6; font-size: 1.05em;">
            <strong>Booking rejection completed!</strong><br>
            The customer will be notified of the rejection with the reason provided. 
            This booking will no longer appear in the pending bookings list.
          </p>
        </div>
      </div>
    `;

    const modal = document.getElementById("detailsModal");
    const modalContentDiv = document.getElementById("modalBody");

    if (modal && modalContentDiv) {
      // Show the modal content
      modalContentDiv.innerHTML = notificationContent;
      modal.style.display = "flex";
      document.getElementById("overlay").style.display = "block";

      // Update modal title
      const modalHeader = modal.querySelector(".modal-header h2");
      if (modalHeader) {
        modalHeader.textContent = `Booking Rejected - ${customerName}`;
      }

      // Create custom footer with close button
      const modalFooter = modal.querySelector(".modal-footer");
      if (modalFooter) {
        modalFooter.innerHTML = `
          <button id="closeRejectionSuccessBtn" class="btn btn-primary">Got it!</button>
        `;

        // Add event listener
        document
          .getElementById("closeRejectionSuccessBtn")
          .addEventListener("click", () => {
            modal.style.display = "none";
            document.getElementById("overlay").style.display = "none";
            resolve();
          });
      }

      // Add close functionality for X button and overlay
      const closeBtn = modal.querySelector("#modalCloseBtn");
      const overlay = document.getElementById("overlay");

      const closeModal = () => {
        modal.style.display = "none";
        overlay.style.display = "none";
        resolve();
      };

      if (closeBtn) closeBtn.onclick = closeModal;
      if (overlay)
        overlay.onclick = (e) => {
          if (e.target === overlay) closeModal();
        };
    } else {
      console.error(
        "Modal elements not found for booking rejection success notification!"
      );
      // Don't show alert - just resolve silently
      resolve();
    }
  });
}

/**
 * Shows a real-time rejection notification modal
 * @param {string} bookingId - The booking ID
 * @param {Object} bookingData - The booking data
 * @param {string} rejectionReason - The reason for rejection
 */
export function showRealtimeRejectionNotification(
  bookingId,
  bookingData,
  rejectionReason
) {
  return new Promise((resolve) => {
    const customerName = bookingData.ownerInformation
      ? `${bookingData.ownerInformation.firstName || ""} ${bookingData.ownerInformation.lastName || ""}`.trim()
      : "Unknown Customer";
    const petName = bookingData.petInformation?.petName || "Unknown Pet";
    const serviceType = bookingData.serviceType || "Unknown Service";
    let bookingDate = "N/A";
    if (bookingData.date) {
      try {
        bookingDate = new Date(bookingData.date.toDate()).toLocaleDateString();
      } catch (e) {
        bookingDate = new Date(bookingData.date).toLocaleDateString();
      }
    }

    const notificationContent = `
      <div class="modal-section" style="background: #f8d7da; padding: 25px; border-radius: 12px; margin-bottom: 20px; border-left: 5px solid #dc3545;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 4em; color: #dc3545; margin-bottom: 15px;">🚫</div>
          <h3 style="color: #721c24; margin: 0; font-size: 1.5em; font-weight: bold;">Real-time Booking Rejection Alert!</h3>
          <p style="color: #721c24; margin: 10px 0 0 0; font-size: 1.1em;">A booking has been rejected and requires your attention.</p>
        </div>
      </div>
      <div class="modal-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #ffb64a; padding-bottom: 10px;">📋 Booking Information</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px;">
            <div><strong>Customer:</strong> ${customerName}</div>
            <div><strong>Pet Name:</strong> ${petName}</div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px;">
            <div><strong>Service Type:</strong> ${serviceType}</div>
            <div><strong>Booking Date:</strong> ${bookingDate}</div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div><strong>Status:</strong> <span style="color: #dc3545; font-weight: bold;">❌ Rejected</span></div>
            <div><strong>Alert Type:</strong> <span style="color: #dc3545; font-weight: bold;">🚫 Real-time</span></div>
          </div>
        </div>
      </div>
      <div class="modal-section" style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
        <h3 style="color: #856404; margin-bottom: 15px; border-bottom: 2px solid #ffc107; padding-bottom: 10px;">📝 Rejection Details</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <div style="padding: 12px; background: #f8f9fa; border-radius: 4px; border-left: 4px solid #dc3545;">
            <strong style="color: #721c24;">Rejection Reason:</strong><br>
            <span style="color: #721c24; font-size: 1.05em;">${rejectionReason}</span>
          </div>
        </div>
      </div>
      <div class="modal-section" style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #0c5460; margin-bottom: 15px; border-bottom: 2px solid #17a2b8; padding-bottom: 10px;">⚡ Real-time Alert</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div style="padding: 10px; background: #f8d7da; border-radius: 6px; border-left: 4px solid #dc3545;">
              <strong style="color: #721c24;">Alert Type:</strong><br>
              <span style="color: #721c24;">🚫 Booking Rejection</span>
            </div>
            <div style="padding: 10px; background: #d1ecf1; border-radius: 6px; border-left: 4px solid #17a2b8;">
              <strong style="color: #0c5460;">Timestamp:</strong><br>
              <span style="color: #0c5460;">${new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-section" style="background: #e2e3e5; padding: 20px; border-radius: 8px; text-align: center;">
        <h3 style="color: #495057; margin-bottom: 15px;">📋 Next Steps</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <p style="color: #495057; margin: 0; line-height: 1.6; font-size: 1.05em;">
            <strong>Booking rejection detected!</strong><br>
            This booking has been rejected and the customer has been notified. 
            You can view more details in the "Pending Bookings" section.
          </p>
        </div>
      </div>
    `;

    const modal =
      document.getElementById("viewDetailsModal") ||
      document.getElementById("detailsModal");
    const modalContentDiv =
      document.getElementById("bookingDetailsContent") ||
      document.getElementById("modalBody");

    if (modal && modalContentDiv) {
      showGenericModal(
        modal,
        "Real-time Rejection Alert",
        notificationContent,
        modalContentDiv
      );

      // Auto-close after 10 seconds
      setTimeout(() => {
        const closeBtn = modal.querySelector("#modalCloseBtn");
        if (closeBtn) {
          closeBtn.click();
        }
        resolve();
      }, 10000);
    } else {
      console.error(
        "Modal elements not found for real-time rejection notification!"
      );
      alert(
        `Real-time Rejection Alert!\n\nBooking ${bookingId} has been rejected for ${customerName}'s ${petName}.`
      );
      resolve();
    }
  });
}

/**
 * Helper function to get pet size category (copied from bookings-approved.js)
 * @param {number} weightKg - The pet's weight in kilograms
 * @returns {string} The pet size category
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

/**
 * Shows a real-time acceptance notification modal
 * @param {string} bookingId - The booking ID
 * @param {Object} bookingData - The booking data
 */
export function showRealtimeAcceptanceNotification(bookingId, bookingData) {
  return new Promise((resolve) => {
    const customerName = bookingData.ownerInformation
      ? `${bookingData.ownerInformation.firstName || ""} ${bookingData.ownerInformation.lastName || ""}`.trim()
      : "Unknown Customer";
    const petName = bookingData.petInformation?.petName || "Unknown Pet";
    const serviceType = bookingData.serviceType || "Unknown Service";
    let bookingDate = "N/A";
    if (bookingData.date) {
      try {
        bookingDate = new Date(bookingData.date.toDate()).toLocaleDateString();
      } catch (e) {
        bookingDate = new Date(bookingData.date).toLocaleDateString();
      }
    }

    const notificationContent = `
      <div class="modal-section" style="background: #d4edda; padding: 25px; border-radius: 12px; margin-bottom: 20px; border-left: 5px solid #28a745;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 4em; color: #28a745; margin-bottom: 15px;">✅</div>
          <h3 style="color: #155724; margin: 0; font-size: 1.5em; font-weight: bold;">Real-time Booking Acceptance Alert!</h3>
          <p style="color: #155724; margin: 10px 0 0 0; font-size: 1.1em;">A booking has been accepted and is now approved.</p>
        </div>
      </div>
      <div class="modal-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #ffb64a; padding-bottom: 10px;">📋 Booking Information</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px;">
            <div><strong>Customer:</strong> ${customerName}</div>
            <div><strong>Pet Name:</strong> ${petName}</div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px;">
            <div><strong>Service Type:</strong> ${serviceType}</div>
            <div><strong>Booking Date:</strong> ${bookingDate}</div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">✅ Approved</span></div>
            <div><strong>Alert Type:</strong> <span style="color: #28a745; font-weight: bold;">✅ Real-time</span></div>
          </div>
        </div>
      </div>
      <div class="modal-section" style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #0c5460; margin-bottom: 15px; border-bottom: 2px solid #17a2b8; padding-bottom: 10px;">⚡ Real-time Alert</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div style="padding: 10px; background: #d4edda; border-radius: 6px; border-left: 4px solid #28a745;">
              <strong style="color: #155724;">Alert Type:</strong><br>
              <span style="color: #155724;">✅ Booking Acceptance</span>
            </div>
            <div style="padding: 10px; background: #d1ecf1; border-radius: 6px; border-left: 4px solid #17a2b8;">
              <strong style="color: #0c5460;">Timestamp:</strong><br>
              <span style="color: #0c5460;">${new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-section" style="background: #e2e3e5; padding: 20px; border-radius: 8px; text-align: center;">
        <h3 style="color: #495057; margin-bottom: 15px;">📋 Next Steps</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <p style="color: #495057; margin: 0; line-height: 1.6; font-size: 1.05em;">
            <strong>Booking acceptance confirmed!</strong><br>
            This booking has been approved and the customer has been notified. 
            You can view more details in the "Approved Bookings" section.
          </p>
        </div>
      </div>
    `;

    const modal =
      document.getElementById("viewDetailsModal") ||
      document.getElementById("detailsModal");
    const modalContentDiv =
      document.getElementById("bookingDetailsContent") ||
      document.getElementById("modalBody");

    if (modal && modalContentDiv) {
      showGenericModal(
        modal,
        "Real-time Acceptance Alert",
        notificationContent,
        modalContentDiv
      );

      // Auto-close after 8 seconds
      setTimeout(() => {
        const closeBtn = modal.querySelector("#modalCloseBtn");
        if (closeBtn) {
          closeBtn.click();
        }
        resolve();
      }, 8000);
    } else {
      console.error(
        "Modal elements not found for real-time acceptance notification!"
      );
      alert(
        `Real-time Acceptance Alert!\n\nBooking ${bookingId} has been accepted for ${customerName}'s ${petName}.`
      );
      resolve();
    }
  });
}

/**
 * Shows a new rejection modal for booking rejections
 * @param {string} bookingId - The booking ID
 * @param {Object} bookingData - The booking data
 */
export function showNewRejectionModal(bookingId, bookingData) {
  return new Promise((resolve) => {
    const customerName = bookingData.ownerInformation
      ? `${bookingData.ownerInformation.firstName || ""} ${bookingData.ownerInformation.lastName || ""}`.trim()
      : "Unknown Customer";
    const petName = bookingData.petInformation?.petName || "Unknown Pet";
    const serviceType = bookingData.serviceType || "Unknown Service";
    let bookingDate = "N/A";
    if (bookingData.date) {
      try {
        bookingDate = new Date(bookingData.date.toDate()).toLocaleDateString();
      } catch (e) {
        bookingDate = new Date(bookingData.date).toLocaleDateString();
      }
    }

    const notificationContent = `
      <div class="modal-section" style="background: #f8d7da; padding: 25px; border-radius: 12px; margin-bottom: 20px; border-left: 5px solid #dc3545;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 4em; color: #dc3545; margin-bottom: 15px;">🚫</div>
          <h3 style="color: #721c24; margin: 0; font-size: 1.5em; font-weight: bold;">Reject Booking</h3>
          <p style="color: #721c24; margin: 10px 0 0 0; font-size: 1.1em;">Please provide a reason for rejecting this booking.</p>
        </div>
      </div>

      <div class="modal-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #ffb64a; padding-bottom: 10px;">📋 Booking Information</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px;">
            <div><strong>Customer:</strong> ${customerName}</div>
            <div><strong>Pet Name:</strong> ${petName}</div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div><strong>Service Type:</strong> ${serviceType}</div>
            <div><strong>Booking Date:</strong> ${bookingDate}</div>
          </div>
        </div>
      </div>

      <div class="modal-section" style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
        <h3 style="color: #856404; margin-bottom: 15px; border-bottom: 2px solid #ffc107; padding-bottom: 10px;">🚫 Rejection Reason</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <label for="rejectionReason" style="display: block; margin-bottom: 10px; font-weight: 600; color: #333;">
            Select a reason for rejection:
          </label>
          <select id="rejectionReason" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; margin-bottom: 15px;">
            <option value="">-- Select a reason --</option>
            <option value="Incomplete Information">Incomplete Information</option>
            <option value="No Available Slots">No Available Slots</option>
            <option value="Pet Health Concerns">Pet Health Concerns</option>
            <option value="Service Not Available">Service Not Available</option>
            <option value="Customer Request">Customer Request</option>
            <option value="Other">Other</option>
          </select>
          
          <label for="additionalNotes" style="display: block; margin-bottom: 10px; font-weight: 600; color: #333;">
            Additional Notes (Optional):
          </label>
          <textarea 
            id="additionalNotes" 
            placeholder="Enter any additional details about the rejection..."
            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; min-height: 80px; resize: vertical;"
          ></textarea>
        </div>
      </div>

      <div class="modal-section" style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #0c5460; margin-bottom: 15px; border-bottom: 2px solid #17a2b8; padding-bottom: 10px;">⚠️ Important Notice</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <p style="color: #0c5460; margin: 0; line-height: 1.6; font-size: 1.05em;">
            <strong>Please note:</strong> Once you reject this booking, the customer will be notified and this action cannot be undone. 
            Make sure you have selected the appropriate reason before proceeding.
          </p>
        </div>
      </div>
    `;

    const modal =
      document.getElementById("viewDetailsModal") ||
      document.getElementById("detailsModal");
    const modalContentDiv =
      document.getElementById("bookingDetailsContent") ||
      document.getElementById("modalBody");

    if (modal && modalContentDiv) {
      showGenericModal(
        modal,
        "Reject Booking",
        notificationContent,
        modalContentDiv
      );

      // Create custom footer with action buttons
      const modalFooter = modal.querySelector(".modal-footer");
      if (modalFooter) {
        modalFooter.innerHTML = `
          <button id="cancelRejectionBtn" class="btn btn-secondary" style="margin-right: 10px;">Cancel</button>
          <button id="confirmRejectionBtn" class="btn btn-danger">Reject Booking</button>
        `;

        // Add event listeners
        document
          .getElementById("cancelRejectionBtn")
          .addEventListener("click", () => {
            modal.style.display = "none";
            document.getElementById("overlay").style.display = "none";
            resolve(null); // Return null to indicate cancellation
          });

        document
          .getElementById("confirmRejectionBtn")
          .addEventListener("click", () => {
            const reason = document.getElementById("rejectionReason").value;
            const notes = document.getElementById("additionalNotes").value;

            if (!reason) {
              alert("Please select a reason for rejection.");
              return;
            }

            const rejectionData = {
              reason: reason,
              notes: notes || "",
              timestamp: new Date().toISOString(),
            };

            modal.style.display = "none";
            document.getElementById("overlay").style.display = "none";
            resolve(rejectionData);
          });
      }

      // Add close functionality for X button and overlay
      const closeBtn = modal.querySelector("#modalCloseBtn");
      const overlay = document.getElementById("overlay");

      const closeModal = () => {
        modal.style.display = "none";
        overlay.style.display = "none";
        resolve(null);
      };

      if (closeBtn) closeBtn.onclick = closeModal;
      if (overlay)
        overlay.onclick = (e) => {
          if (e.target === overlay) closeModal();
        };
    } else {
      console.error("Modal elements not found for new rejection modal!");
      alert(`Rejection modal for booking ${bookingId} could not be displayed.`);
      resolve(null);
    }
  });
}

/**
 * Shows a new rejection success modal when booking rejection is completed
 * @param {string} bookingId - The booking ID
 * @param {Object} bookingData - The booking data
 * @param {Object} rejectionData - The rejection data (reason, notes, timestamp)
 */
export function showNewRejectionSuccessModal(
  bookingId,
  bookingData,
  rejectionData
) {
  return new Promise((resolve) => {
    const customerName = bookingData.ownerInformation
      ? `${bookingData.ownerInformation.firstName || ""} ${bookingData.ownerInformation.lastName || ""}`.trim()
      : "Unknown Customer";
    const petName = bookingData.petInformation?.petName || "Unknown Pet";
    const serviceType = bookingData.serviceType || "Unknown Service";
    let bookingDate = "N/A";
    if (bookingData.date) {
      try {
        bookingDate = new Date(bookingData.date.toDate()).toLocaleDateString();
      } catch (e) {
        bookingDate = new Date(bookingData.date).toLocaleDateString();
      }
    }

    const notificationContent = `
      <div class="modal-section" style="background: #d4edda; padding: 25px; border-radius: 12px; margin-bottom: 20px; border-left: 5px solid #28a745;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 4em; color: #28a745; margin-bottom: 15px;">✅</div>
          <h3 style="color: #155724; margin: 0; font-size: 1.5em; font-weight: bold;">Booking Rejected Successfully!</h3>
          <p style="color: #155724; margin: 10px 0 0 0; font-size: 1.1em;">The booking has been rejected and the customer will be notified.</p>
        </div>
      </div>

      <div class="modal-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #ffb64a; padding-bottom: 10px;">📋 Booking Information</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px;">
            <div><strong>Customer:</strong> ${customerName}</div>
            <div><strong>Pet Name:</strong> ${petName}</div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px;">
            <div><strong>Service Type:</strong> ${serviceType}</div>
            <div><strong>Booking Date:</strong> ${bookingDate}</div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div><strong>Status:</strong> <span style="color: #dc3545; font-weight: bold;">❌ Rejected</span></div>
            <div><strong>Customer Notification:</strong> <span style="color: #17a2b8; font-weight: bold;">📧 Will be notified</span></div>
          </div>
        </div>
      </div>

      <div class="modal-section" style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
        <h3 style="color: #856404; margin-bottom: 15px; border-bottom: 2px solid #ffc107; padding-bottom: 10px;">📝 Rejection Details</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <div style="padding: 12px; background: #f8f9fa; border-radius: 4px; border-left: 4px solid #dc3545; margin-bottom: 10px;">
            <strong style="color: #721c24;">Rejection Reason:</strong><br>
            <span style="color: #721c24; font-size: 1.05em;">${rejectionData.reason}</span>
          </div>
          ${
            rejectionData.notes
              ? `
          <div style="padding: 12px; background: #f8f9fa; border-radius: 4px; border-left: 4px solid #6c757d;">
            <strong style="color: #495057;">Additional Notes:</strong><br>
            <span style="color: #495057; font-size: 1.05em;">${rejectionData.notes}</span>
          </div>
          `
              : ""
          }
        </div>
      </div>

      <div class="modal-section" style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #0c5460; margin-bottom: 15px; border-bottom: 2px solid #17a2b8; padding-bottom: 10px;">✅ Status Updates</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div style="padding: 10px; background: #f8d7da; border-radius: 6px; border-left: 4px solid #dc3545;">
              <strong style="color: #721c24;">Booking Status:</strong><br>
              <span style="color: #721c24;">❌ Rejected</span>
            </div>
            <div style="padding: 10px; background: #d1ecf1; border-radius: 6px; border-left: 4px solid #17a2b8;">
              <strong style="color: #0c5460;">Customer Notification:</strong><br>
              <span style="color: #0c5460;">📧 Will be notified</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-section" style="background: #e2e3e5; padding: 20px; border-radius: 8px; text-align: center;">
        <h3 style="color: #495057; margin-bottom: 15px;">📋 Next Steps</h3>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <p style="color: #495057; margin: 0; line-height: 1.6; font-size: 1.05em;">
            <strong>Booking rejection completed!</strong><br>
            The customer will be notified of the rejection with the reason provided. 
            This booking will no longer appear in the pending bookings list.
          </p>
        </div>
      </div>
    `;

    const modal =
      document.getElementById("viewDetailsModal") ||
      document.getElementById("detailsModal");
    const modalContentDiv =
      document.getElementById("bookingDetailsContent") ||
      document.getElementById("modalBody");

    if (modal && modalContentDiv) {
      showGenericModal(
        modal,
        "Rejection Successful",
        notificationContent,
        modalContentDiv
      );

      // Create custom footer with close button
      const modalFooter = modal.querySelector(".modal-footer");
      if (modalFooter) {
        modalFooter.innerHTML = `
          <button id="closeRejectionSuccessBtn" class="btn btn-primary">Got it!</button>
        `;

        // Add event listener
        document
          .getElementById("closeRejectionSuccessBtn")
          .addEventListener("click", () => {
            modal.style.display = "none";
            document.getElementById("overlay").style.display = "none";
            resolve();
          });
      }

      // Add close functionality for X button and overlay
      const closeBtn = modal.querySelector("#modalCloseBtn");
      const overlay = document.getElementById("overlay");

      const closeModal = () => {
        modal.style.display = "none";
        overlay.style.display = "none";
        resolve();
      };

      if (closeBtn) closeBtn.onclick = closeModal;
      if (overlay)
        overlay.onclick = (e) => {
          if (e.target === overlay) closeModal();
        };
    } else {
      console.error(
        "Modal elements not found for new rejection success modal!"
      );
      // Don't show alert - just resolve silently
      resolve();
    }
  });
}
