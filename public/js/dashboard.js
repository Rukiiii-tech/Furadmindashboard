// Import necessary Firebase functions for real-time listening
import { db, collection, query, where, onSnapshot } from "./firebase-config.js";

// Wait for DOM content to be loaded
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Dashboard.js loaded. Setting up real-time data listeners...");

  // Function to update a count element in the DOM
  const updateCount = (id, count) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = count;
    } else {
      console.warn(`Element with ID '${id}' not found.`);
    }
  };

  // Store unsubscribe functions for real-time listeners
  const unsubscribeFunctions = [];

  // Setup real-time listener for a Firestore collection
  const setupRealtimeCountListener = (
    collectionName,
    elementId,
    filter = null
  ) => {
    console.log(`Setting up listener for ${collectionName}`);
    let q = collection(db, collectionName);
    if (filter) {
      q = query(q, where(filter.field, filter.operator, filter.value));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const count = snapshot.size;
        updateCount(elementId, count);
        console.log(`${collectionName} count updated: ${count}`);
      },
      (error) => {
        console.error(`Error fetching ${collectionName} data:`, error);
        updateCount(elementId, "Error!");
      }
    );
    unsubscribeFunctions.push(unsubscribe);
  };

  // Initialize all real-time listeners
  setupRealtimeCountListener("users", "userCount", null);
  setupRealtimeCountListener("bookings", "pendingBookingsCount", {
    field: "status",
    operator: "==",
    value: "Pending",
  });
  setupRealtimeCountListener("feedingHistory", "feedingReportsCount", null);
  // FIX: Changed 'pets' collection to 'bookings' collection
  // This will count the number of booking documents, which is where pet data is currently linked in pets.js.
  setupRealtimeCountListener(
    "bookings", // Changed from "pets" to "bookings"
    "petsCount",
    null
  );
  setupRealtimeCountListener("bookings", "totalBookedCount", null);

  // ===================== Weekly Sales (This Week) =====================
  const weeklySalesElement = document.getElementById("weeklySalesAmount");
  if (weeklySalesElement) {
    // Helpers
    const getWeekRange = () => {
      const now = new Date();
      const day = now.getDay(); // 0=Sun..6=Sat
      const diffToMonday = (day + 6) % 7; // days since Monday
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(now.getDate() - diffToMonday);
      const end = new Date(start);
      end.setDate(start.getDate() + 7); // exclusive end
      end.setMilliseconds(end.getMilliseconds() - 1);
      return { start, end };
    };

    const formatCurrency = (amount) =>
      `₱${Number(amount || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    const getPetSizeCategory = (weightKg) => {
      const w = typeof weightKg === "number" ? weightKg : parseFloat(weightKg);
      if (isNaN(w)) return "N/A";
      if (w < 10) return "Small";
      if (w >= 11 && w <= 26) return "Medium";
      if (w >= 27 && w <= 34) return "Large";
      if (w >= 34 && w <= 38) return "XL";
      if (w > 38) return "XXL";
      return "N/A";
    };

    const calculateSalesAmount = (bookingData) => {
      const sizePrices = {
        Small: 500,
        Medium: 600,
        Large: 700,
        XL: 800,
        XXL: 900,
        "N/A": 0,
      };

      let totalAmount = 0;
      const petWeight = bookingData?.petInformation?.petWeight;
      const petSize = getPetSizeCategory(petWeight);

      if (bookingData.serviceType === "Boarding") {
        const dailyPrice = sizePrices[petSize] || 0;
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
        }
      } else if (bookingData.serviceType === "Grooming") {
        totalAmount = sizePrices[petSize] || 0;
      }

      return totalAmount;
    };

    const getAccurateSaleDate = (bookingData) => {
      if (
        bookingData?.serviceType === "Boarding" &&
        bookingData?.boardingDetails?.checkInDate
      ) {
        return new Date(bookingData.boardingDetails.checkInDate);
      }
      if (
        bookingData?.serviceType === "Grooming" &&
        bookingData?.groomingDetails?.groomingCheckInDate
      ) {
        return new Date(bookingData.groomingDetails.groomingCheckInDate);
      }
      if (
        bookingData?.timestamp &&
        typeof bookingData.timestamp.toDate === "function"
      ) {
        return bookingData.timestamp.toDate();
      }
      if (bookingData?.date) {
        return new Date(bookingData.date);
      }
      return null;
    };

    const { start: weekStart, end: weekEnd } = getWeekRange();

    // Listen to completed/checked-out bookings only
    const bookingsCol = collection(db, "bookings");
    const statusFilteredQuery = query(
      bookingsCol,
      where("status", "in", ["Checked-Out", "Completed"])
    );

    const unsubscribeWeekly = onSnapshot(
      statusFilteredQuery,
      (snapshot) => {
        let weeklyTotal = 0;
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const saleDate = getAccurateSaleDate(data);
          if (!saleDate || isNaN(saleDate.getTime())) return;
          if (saleDate >= weekStart && saleDate <= weekEnd) {
            weeklyTotal += calculateSalesAmount(data);
          }
        });
        weeklySalesElement.textContent = formatCurrency(weeklyTotal);
      },
      (error) => {
        console.error("Error listening for weekly sales:", error);
        weeklySalesElement.textContent = "₱0";
      }
    );

    unsubscribeFunctions.push(unsubscribeWeekly);
  }
});
