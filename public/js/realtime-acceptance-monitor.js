// Real-time monitoring for booking acceptances
import { db, collection, query, where, onSnapshot } from "./firebase-config.js";
import {
  showSuccessNotification,
  showInfoNotification,
  showErrorNotification,
} from "./realtime-indicator.js";
import { showRealtimeAcceptanceNotification } from "./notification-modal.js";

let acceptanceListener = null;
let isMonitoring = false;
let notifiedAcceptances = new Set(); // Track notifications to prevent duplicates

/**
 * Starts real-time monitoring for booking acceptances
 */
export function startAcceptanceMonitoring() {
  if (isMonitoring) {
    console.log("Acceptance monitoring already active");
    return;
  }

  console.log("Starting real-time acceptance monitoring...");

  try {
    // Listen for approved bookings (simplified query to avoid index requirement)
    const approvedBookingsQuery = query(
      collection(db, "bookings"),
      where("status", "==", "Approved")
    );

    acceptanceListener = onSnapshot(
      approvedBookingsQuery,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added" || change.type === "modified") {
            const bookingData = change.doc.data();
            const bookingId = change.doc.id;

            // Check if this is a recent acceptance (within last 5 minutes)
            const now = new Date();
            let updatedAt;

            // Handle different timestamp formats
            if (bookingData.updatedAt) {
              if (bookingData.updatedAt.toDate) {
                updatedAt = bookingData.updatedAt.toDate();
              } else if (bookingData.updatedAt instanceof Date) {
                updatedAt = bookingData.updatedAt;
              } else {
                updatedAt = new Date(bookingData.updatedAt);
              }
            } else {
              // Fallback to current time if no updatedAt field
              updatedAt = now;
            }

            const timeDiff = now - updatedAt;

            // Only show notification for recent acceptances (within 5 minutes)
            // and only if we haven't already notified about this acceptance
            if (
              timeDiff < 5 * 60 * 1000 &&
              timeDiff > 0 &&
              !notifiedAcceptances.has(bookingId)
            ) {
              notifiedAcceptances.add(bookingId);
              handleAcceptanceNotification(bookingId, bookingData);

              // Clean up old notifications after 10 minutes to prevent memory buildup
              setTimeout(
                () => {
                  notifiedAcceptances.delete(bookingId);
                },
                10 * 60 * 1000
              );
            }
          }
        });
      },
      (error) => {
        console.error("Error in acceptance monitoring:", error);
        showErrorNotification("Acceptance monitoring error: " + error.message);
      }
    );

    isMonitoring = true;
    console.log("Acceptance monitoring started successfully");
  } catch (error) {
    console.error("Failed to start acceptance monitoring:", error);
    showErrorNotification("Failed to start acceptance monitoring");
  }
}

/**
 * Stops real-time monitoring for booking acceptances
 */
export function stopAcceptanceMonitoring() {
  if (acceptanceListener) {
    acceptanceListener();
    acceptanceListener = null;
  }
  isMonitoring = false;
  notifiedAcceptances.clear(); // Clear notification tracking
  console.log("Acceptance monitoring stopped");
}

/**
 * Handles acceptance notification display
 */
async function handleAcceptanceNotification(bookingId, bookingData) {
  const customerName = bookingData.ownerInformation
    ? `${bookingData.ownerInformation.firstName || ""} ${bookingData.ownerInformation.lastName || ""}`.trim()
    : "Unknown Customer";

  const petName = bookingData.petInformation?.petName || "Unknown Pet";
  const serviceType = bookingData.serviceType || "Unknown Service";

  // Show toast notification at bottom right
  showSuccessNotification(
    `Booking accepted: ${customerName}'s ${petName} (${serviceType})`
  );

  // Show detailed modal notification (optional - can be enabled if needed)
  // try {
  //   await showRealtimeAcceptanceNotification(bookingId, bookingData);
  // } catch (error) {
  //   console.error("Error showing acceptance notification modal:", error);
  // }

  // Log the acceptance for debugging
  console.log("Acceptance detected:", {
    bookingId,
    customerName,
    petName,
    serviceType,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Initialize acceptance monitoring system
 */
export function initializeAcceptanceMonitoring() {
  console.log("Initializing acceptance monitoring system...");

  // Start monitoring after a short delay to ensure page is loaded
  setTimeout(() => {
    startAcceptanceMonitoring();
  }, 2000);

  // Restart monitoring if connection is lost
  setInterval(() => {
    if (!isMonitoring) {
      console.log("Restarting acceptance monitoring...");
      startAcceptanceMonitoring();
    }
  }, 30000); // Check every 30 seconds
}

/**
 * Get current monitoring status
 */
export function getAcceptanceMonitoringStatus() {
  return {
    isMonitoring,
    hasListener: !!acceptanceListener,
  };
}
