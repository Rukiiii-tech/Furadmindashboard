// Real-time monitoring for booking rejections
import { db, collection, query, where, onSnapshot } from "./firebase-config.js";
import {
  showSuccessNotification,
  showInfoNotification,
  showErrorNotification,
} from "./realtime-indicator.js";
import { showRealtimeRejectionNotification } from "./notification-modal.js";

let rejectionListener = null;
let isMonitoring = false;
let notifiedRejections = new Set(); // Track notifications to prevent duplicates

/**
 * Starts real-time monitoring for booking rejections
 */
export function startRejectionMonitoring() {
  if (isMonitoring) {
    console.log("Rejection monitoring already active");
    return;
  }

  console.log("Starting real-time rejection monitoring...");

  try {
    // Listen for rejected bookings (simplified query to avoid index requirement)
    const rejectedBookingsQuery = query(
      collection(db, "bookings"),
      where("status", "==", "Rejected")
    );

    rejectionListener = onSnapshot(
      rejectedBookingsQuery,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added" || change.type === "modified") {
            const bookingData = change.doc.data();
            const bookingId = change.doc.id;

            // Check if this is a recent rejection (within last 5 minutes)
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

            // Only show notification for recent rejections (within 5 minutes)
            // and only if we haven't already notified about this rejection
            if (
              timeDiff < 5 * 60 * 1000 &&
              timeDiff > 0 &&
              !notifiedRejections.has(bookingId)
            ) {
              notifiedRejections.add(bookingId);
              handleRejectionNotification(bookingId, bookingData);

              // Clean up old notifications after 10 minutes to prevent memory buildup
              setTimeout(
                () => {
                  notifiedRejections.delete(bookingId);
                },
                10 * 60 * 1000
              );
            }
          }
        });
      },
      (error) => {
        console.error("Error in rejection monitoring:", error);
        showErrorNotification("Rejection monitoring error: " + error.message);
      }
    );

    isMonitoring = true;
    console.log("Rejection monitoring started successfully");
  } catch (error) {
    console.error("Failed to start rejection monitoring:", error);
    showErrorNotification("Failed to start rejection monitoring");
  }
}

/**
 * Stops real-time monitoring for booking rejections
 */
export function stopRejectionMonitoring() {
  if (rejectionListener) {
    rejectionListener();
    rejectionListener = null;
  }
  isMonitoring = false;
  notifiedRejections.clear(); // Clear notification tracking
  console.log("Rejection monitoring stopped");
}

/**
 * Handles rejection notification display
 */
async function handleRejectionNotification(bookingId, bookingData) {
  const customerName = bookingData.ownerInformation
    ? `${bookingData.ownerInformation.firstName || ""} ${bookingData.ownerInformation.lastName || ""}`.trim()
    : "Unknown Customer";

  const petName = bookingData.petInformation?.petName || "Unknown Pet";
  const serviceType = bookingData.serviceType || "Unknown Service";
  const rejectionReason = bookingData.rejectionReason || "No reason provided";

  // Show toast notification
  showSuccessNotification(
    `Booking rejected: ${customerName}'s ${petName} (${serviceType})`
  );

  // Show detailed modal notification
  try {
    await showRealtimeRejectionNotification(
      bookingId,
      bookingData,
      rejectionReason
    );
  } catch (error) {
    console.error("Error showing rejection notification modal:", error);
  }

  // Log the rejection for debugging
  console.log("Rejection detected:", {
    bookingId,
    customerName,
    petName,
    serviceType,
    rejectionReason,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Initialize rejection monitoring system
 */
export function initializeRejectionMonitoring() {
  console.log("Initializing rejection monitoring system...");

  // Start monitoring after a short delay to ensure page is loaded
  setTimeout(() => {
    startRejectionMonitoring();
  }, 2000);

  // Restart monitoring if connection is lost
  setInterval(() => {
    if (!isMonitoring) {
      console.log("Restarting rejection monitoring...");
      startRejectionMonitoring();
    }
  }, 30000); // Check every 30 seconds
}

/**
 * Get current monitoring status
 */
export function getRejectionMonitoringStatus() {
  return {
    isMonitoring,
    hasListener: !!rejectionListener,
  };
}
