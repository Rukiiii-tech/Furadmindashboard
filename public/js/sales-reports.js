// sales-reports.js
import {
  db,
  collection,
  getDocs,
  query,
  orderBy,
  where,
  doc,
  updateDoc,
} from "./firebase-config.js";
import { showWarningNotification } from "./notification-modal.js";

import { showGenericModal } from "./modal_handler.js";

// Global variable to store all fetched and processed sales data for filtering
let allProcessedSalesData = [];

// DOM elements
const salesTableBody = document.getElementById("salesTableBody");
const statusFilter = document.getElementById("statusFilter");
const checkoutFilter = document.getElementById("checkoutFilter");
const dateFilter = document.getElementById("dateFilter");
const refreshSalesBtn = document.getElementById("refreshSalesBtn");
const customDateInputs = document.getElementById("customDateInputs");
const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");

const printSelectedRowsBtn = document.getElementById("printSelectedRowsBtn");
const selectAllRowsCheckbox = document.getElementById("selectAllRows");
const dataTableThead = document.querySelector(".data-table thead tr");

/**
 * Determines the pet size category based on its weight in kilograms, using the updated chart.
 * NOTE: Corrected ranges for continuity.
 * @param {number} weightKg - The pet's weight in kilograms.
 * @returns {string} The pet size category (Small, Medium, Large, XL, XXL).
 */
function getPetSizeCategory(weightKg) {
  if (typeof weightKg !== "number" || isNaN(weightKg)) {
    return "N/A";
  }
  if (weightKg < 10) return "Small";
  if (weightKg >= 10 && weightKg <= 26) return "Medium"; // Fix: Ensures no gap with Small
  if (weightKg >= 27 && weightKg <= 34) return "Large";
  if (weightKg >= 35 && weightKg <= 38) return "XL"; // Fix: Ensures no overlap with Large
  if (weightKg > 38) return "XXL";
  return "N/A";
}

/**
 * Calculates the total amount, down payment, and balance for a booking based on pet size.
 * FIX: The Total Amount for Checked-Out Boarding bookings is now explicitly set
 * to the single-day price, and the balance is calculated from this amount.
 * @param {object} bookingData - The booking data from Firestore.
 * @returns {object} An object containing totalAmount, downPayment, and balance.
 */
function calculateSalesAmounts(bookingData) {
  let fullTotalAmount = 0;
  let petWeight = parseFloat(bookingData.petInformation?.petWeight);
  let petSize = getPetSizeCategory(petWeight);

  // Pricing based on updated pet size categories
  const sizePrices = {
    Small: 500,
    Medium: 600,
    Large: 700,
    XL: 800,
    XXL: 900,
    "N/A": 0,
  };

  // Determine the daily price for all services
  let dailyPrice = sizePrices[petSize] || 0;

  if (bookingData.serviceType === "Boarding") {
    const checkInDateStr =
      bookingData.boardingDetails?.checkInDate || bookingData.date;
    const checkOutDateStr = bookingData.boardingDetails?.checkOutDate;

    if (checkInDateStr) {
      let checkInDate = new Date(checkInDateStr);

      if (isNaN(checkInDate.getTime())) {
        fullTotalAmount = 0;
      } else {
        checkInDate.setHours(0, 0, 0, 0);

        let checkOutDate;
        if (checkOutDateStr) {
          checkOutDate = new Date(checkOutDateStr);
        }

        if (checkOutDate && !isNaN(checkOutDate.getTime())) {
          checkOutDate.setHours(0, 0, 0, 0); // Normalize check-out to start of day

          // Calculate the full duration charge (Total Days Stayed) - Stored here for reference
          const diffTime = checkOutDate.getTime() - checkInDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          let actualDaysStayed = 0;
          if (diffDays >= 0) {
            actualDaysStayed = diffDays + 1;
            fullTotalAmount = dailyPrice * actualDaysStayed; // This is the full revenue amount
          } else {
            fullTotalAmount = 0;
          }
        } else {
          fullTotalAmount = 0;
        }
      }
    } else {
      fullTotalAmount = 0;
    }
  } else if (bookingData.serviceType === "Grooming") {
    fullTotalAmount = dailyPrice;
  }

  let actualDownPayment = parseFloat(
    bookingData.paymentDetails?.downPaymentAmount
  );
  if (isNaN(actualDownPayment)) {
    actualDownPayment = 0;
  }

  // DETERMINE FINAL DISPLAY AMOUNT AND BALANCE
  let totalAmountToDisplay = fullTotalAmount;
  let balance = fullTotalAmount - actualDownPayment;

  // *** THE FIX: Override Total Amount and Balance for Checked-Out Boarding ***
  const isCheckedOut =
    bookingData.status === "Checked-Out" || bookingData.status === "Completed";

  if (
    isCheckedOut &&
    bookingData.serviceType === "Boarding" &&
    dailyPrice > 0
  ) {
    // Set the Total Amount to the single day rate (e.g., P600.00) for display,
    // as requested by the user, ignoring the duration.
    totalAmountToDisplay = dailyPrice;

    // Calculate balance based on the new display total (P600.00 - P399.00 = P201.00)
    balance = totalAmountToDisplay - actualDownPayment;
  }

  return {
    totalAmount: totalAmountToDisplay,
    downPayment: actualDownPayment,
    balance,
    petSize,
  };
}

// Load sales data from 'bookings' collection
async function loadSalesData() {
  try {
    salesTableBody.innerHTML = `
      <tr>
        <td colspan="13" style="text-align: center; padding: 20px;">
          Loading transaction data...
        </td>
      </tr>
    `;

    console.log("Fetching transaction data from bookings collection...");

    const bookingsRef = collection(db, "bookings");
    const q = query(
      bookingsRef,
      where("status", "in", [
        "Approved",
        "Rejected",
        "Completed",
        "Checked-Out",
      ]),
      orderBy("timestamp", "desc")
    );
    // ** THE LINE CAUSING THE FIREBASE INDEX ERROR **
    const querySnapshot = await getDocs(q);

    console.log(
      "Query successful. Number of transaction records found:",
      querySnapshot.size
    );

    let fetchedSales = [];
    const ownerBookingCounts = new Map();
    let transactionCounter = querySnapshot.size;

    querySnapshot.forEach((doc) => {
      const bookingData = doc.data();
      const { totalAmount, downPayment, balance, petSize } =
        calculateSalesAmounts(bookingData);

      const customerName = bookingData.ownerInformation
        ? `${bookingData.ownerInformation.firstName || ""} ${bookingData.ownerInformation.lastName || ""}`.trim()
        : "N/A";

      let accurateSaleDate = "N/A";
      if (
        bookingData.serviceType === "Boarding" &&
        bookingData.boardingDetails?.checkInDate
      ) {
        accurateSaleDate = bookingData.boardingDetails.checkInDate;
      } else if (
        bookingData.serviceType === "Grooming" &&
        bookingData.groomingDetails?.groomingCheckInDate
      ) {
        accurateSaleDate = bookingData.groomingDetails.groomingCheckInDate;
      } else if (bookingData.timestamp) {
        accurateSaleDate = new Date(
          bookingData.timestamp.toDate()
        ).toISOString();
      }

      ownerBookingCounts.set(
        customerName,
        (ownerBookingCounts.get(customerName) || 0) + 1
      );

      const isCheckedOut =
        bookingData.status === "Checked-Out" ||
        bookingData.status === "Completed";
      const checkoutStatus = isCheckedOut ? "Checked Out" : "Not Checked Out";

      let paymentStatus = bookingData.paymentDetails?.paymentStatus || "Unpaid";

      // FIX: Set paymentStatus to "Paid" if booking is Checked-Out or Completed
      if (isCheckedOut) {
        paymentStatus = "Paid";
      }

      fetchedSales.push({
        id: doc.id,
        transactionID: transactionCounter,
        customerName: customerName,
        serviceType: bookingData.serviceType || "N/A",
        totalAmount: totalAmount,
        downPayment: downPayment,
        balance: balance,
        paymentMethod: bookingData.paymentDetails?.method || "N/A",
        date: accurateSaleDate,
        status: bookingData.status || "N/A",
        petSize: petSize,
        paymentStatus: paymentStatus,
        checkoutStatus: checkoutStatus,
        isCheckedOut: isCheckedOut,
        fullBookingData: bookingData,
      });

      transactionCounter--;
    });

    allProcessedSalesData = fetchedSales.map((sale) => ({
      ...sale,
      ownerBookingCount: ownerBookingCounts.get(sale.customerName) || 0,
    }));

    displaySalesData(allProcessedSalesData);
    setupCheckboxListeners(); // Add this line to set up the row listeners
    updatePrintButtonState(); // Update the button state on load
  } catch (error) {
    console.error("Error loading sales data from bookings collection:", error);
    salesTableBody.innerHTML = `
      <tr>
        <td colspan="13" style="text-align: center; padding: 20px; color: red;">
          Error loading transaction data. Please check the browser console for details (F12).
        </td>
      </tr>
    `;
  }
}

// Display sales data in table
function displaySalesData(salesData) {
  if (salesData.length === 0) {
    salesTableBody.innerHTML = `
      <tr>
        <td colspan="13" style="text-align: center; padding: 20px;">
          No transaction data found.
        </td>
      </tr>
    `;
    return;
  }

  salesTableBody.innerHTML = salesData
    .map(
      (sale) => `
      <tr>
        <td><input type="checkbox" class="row-select-checkbox" /></td> 
        
        <td data-column="transactionID">${sale.transactionID}</td>
        <td data-column="customerName">${sale.customerName}</td>
        <td data-column="serviceType">${sale.serviceType}</td>
        <td data-column="petSize">${sale.petSize}</td>
        <td data-column="totalAmount">₱${sale.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td data-column="downPayment">₱${sale.downPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td data-column="balance">
          ₱${sale.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
        <td data-column="paymentMethod">${sale.paymentMethod}</td>
        <td data-column="date">${formatDate(sale.date)}</td>
        <td data-column="status">
          <span class="status-badge status-${(sale.paymentStatus || "unpaid").toLowerCase()}">${sale.paymentStatus || "Unpaid"}</span>
        </td>
        <td data-column="checkoutStatus">
          <span class="status-badge ${sale.isCheckedOut ? "status-checked-out" : "status-not-checked-out"}">
            ${sale.checkoutStatus}
          </span>
        </td>
        <td data-column="receipt" class="no-print">
            <button class="action-btn btn-view" onclick="showReceiptModal('${sale.id}')">
                Receipt
            </button>
        </td>
      </tr>
    `
    )
    .join("");

  addSalesSummary(salesData);
}

// Format date
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Format date and time for receipt
function formatDateTime(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Format currency
function formatCurrency(amount) {
  if (typeof amount !== "number" || isNaN(amount)) return "₱0.00";
  return `₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// =========================================================================
// NEW FUNCTION: showReceiptModal
// =========================================================================

/**
 * Displays a print-friendly receipt modal for a specific sales transaction.
 * @param {string} saleId - The ID of the sales object.
 */
window.showReceiptModal = function (saleId) {
  const sale = allProcessedSalesData.find((s) => s.id === saleId);
  if (!sale || !sale.fullBookingData) {
    console.error(
      "Invalid sale object provided for receipt generation:",
      saleId
    );
    return;
  }

  const bookingData = sale.fullBookingData;

  // Format relevant dates
  const transactionDate = formatDateTime(sale.date);
  const checkInDate = formatDate(
    bookingData.boardingDetails?.checkInDate ||
      bookingData.groomingDetails?.groomingCheckInDate ||
      sale.date
  );
  const checkOutDate =
    sale.serviceType === "Boarding"
      ? formatDate(bookingData.boardingDetails?.checkOutDate)
      : "N/A";

  // Determine service details based on type
  let serviceDetailsHtml = "";
  let subTotal = sale.totalAmount;
  let serviceDuration = "N/A";

  if (sale.serviceType === "Boarding") {
    const checkIn = new Date(bookingData.boardingDetails?.checkInDate);
    const checkOut = new Date(bookingData.boardingDetails?.checkOutDate);
    if (!isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime())) {
      const diffTime = checkOut.getTime() - checkIn.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      serviceDuration = `${diffDays} Day(s) Stay`;
      // Note: Since Boarding uses a single-day rate for Checked-Out status, we show the duration but
      // explicitly state the unit price is the daily rate (PXXX) based on the size category.
    }
    serviceDetailsHtml = `
          <div class="receipt-item">
              <span class="item-name">Boarding Service (${sale.petSize} Pet)</span>
              <span class="item-price">${formatCurrency(sale.totalAmount)}</span>
          </div>
          <div class="receipt-item sub-detail">
              <span class="item-name">- ${bookingData.boardingDetails?.selectedRoomType || "Standard Room"}</span>
              <span class="item-price"></span>
          </div>
      `;
  } else if (sale.serviceType === "Grooming") {
    serviceDuration = "1 Session";
    serviceDetailsHtml = `
          <div class="receipt-item">
              <span class="item-name">Grooming Service (${sale.petSize} Pet)</span>
              <span class="item-price">${formatCurrency(sale.totalAmount)}</span>
          </div>
      `;
  }

  // Build the receipt HTML content
  const receiptHtml = `
    <div class="receipt-content-wrapper" id="receiptPrintTarget">
      <div class="receipt-print-area">
        <div class="receipt-header" style="text-align: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #333;">
          <h2 style="color: #000; margin: 0; font-size: 1.8em; font-weight: bold;">FURRY TAILS</h2>
          <p style="margin: 5px 0 0 0; font-size: 0.9em;">Meycauayan Pet Hotel & Grooming Center</p>
          <p style="margin: 0; font-size: 0.8em;">Receipt No: #${sale.transactionID}</p>
          <p style="margin: 0; font-size: 0.8em;">Date: ${transactionDate}</p>
        </div>

        <div class="receipt-section customer-info" style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px dashed #ccc;">
          <h4 style="margin-top: 0; margin-bottom: 10px; font-size: 1.1em; font-weight: bold;">Transaction Summary</h4>
          <div class="info-line">
            <span class="info-label">Customer:</span>
            <span class="info-value">${sale.customerName}</span>
          </div>
          <div class="info-line">
            <span class="info-label">Pet Name:</span>
            <span class="info-value">${bookingData.petInformation?.petName || "N/A"} (${sale.petSize})</span>
          </div>
          <div class="info-line">
            <span class="info-label">Service Type:</span>
            <span class="info-value">${sale.serviceType} (${serviceDuration})</span>
          </div>
          <div class="info-line">
            <span class="info-label">Start Date:</span>
            <span class="info-value">${checkInDate}</span>
          </div>
          ${
            sale.serviceType === "Boarding"
              ? `
          <div class="info-line">
            <span class="info-label">End Date:</span>
            <span class="info-value">${checkOutDate}</span>
          </div>`
              : ""
          }
        </div>
        
        <h4 style="margin-top: 0; margin-bottom: 10px; font-size: 1.1em; font-weight: bold;">Charges</h4>
        <div class="receipt-charges" style="margin-bottom: 15px; border-bottom: 1px dashed #ccc; padding-bottom: 10px;">
            ${serviceDetailsHtml}
        </div>
        
        <div class="receipt-totals">
            <div class="total-line sub-total">
                <span>Subtotal:</span>
                <span>${formatCurrency(subTotal)}</span>
            </div>
            <div class="total-line down-payment">
                <span>Less: Down Payment:</span>
                <span>(${formatCurrency(sale.downPayment)})</span>
            </div>
            <div class="total-line balance-due" style="border-top: 2px solid #333; margin-top: 10px; padding-top: 10px;">
                <span style="font-size: 1.2em; font-weight: bold;">Amount Due:</span>
                <span style="font-size: 1.2em; font-weight: bold;">${formatCurrency(sale.balance)}</span>
            </div>
            
            <div class="total-line final-status" style="margin-top: 20px; padding: 10px; background: #e8f5e9; border-radius: 4px;">
                <span style="font-weight: bold; color: #2e7d32;">Payment Status:</span>
                <span style="font-weight: bold; color: #2e7d32;">${sale.paymentStatus} via ${sale.paymentMethod}</span>
            </div>
        </div>

        <div class="receipt-footer" style="text-align: center; margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 0.8em;">
            <p>Thank you for choosing Furry Tails!</p>
            <p>Admin: ${bookingData.ownerInformation?.firstName} ${bookingData.ownerInformation?.lastName}</p>
        </div>
      </div>
    </div>
  `;

  // Use the existing generic modal handler
  showGenericModal(
    document.getElementById("detailsModal"),
    `Receipt - #${sale.transactionID}`,
    receiptHtml
  );

  // Custom button for printing the modal content
  const modalFooter = document
    .getElementById("detailsModal")
    .querySelector(".modal-footer");
  // Clear the default Close button added by showGenericModal
  modalFooter.innerHTML = "";

  const closeButton = document.createElement("button");
  closeButton.className = "btn btn-secondary action-btn";
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", () =>
    window.hideGenericModal(document.getElementById("detailsModal"))
  );

  const printButton = document.createElement("button");
  printButton.className = "btn btn-primary action-btn";
  printButton.textContent = "Print Receipt";
  printButton.style.marginLeft = "10px";
  printButton.addEventListener("click", () =>
    printReceiptContent("receiptPrintTarget")
  );

  modalFooter.appendChild(closeButton);
  modalFooter.appendChild(printButton);
};

// =========================================================================
// NEW FUNCTION: printReceiptContent
// This function handles the printing of the specific receipt HTML content
// using the existing print infrastructure
// =========================================================================
window.printReceiptContent = function (elementId) {
  const contentToPrint = document.getElementById(elementId);
  if (!contentToPrint) {
    console.error("Element to print not found:", elementId);
    return;
  }

  // Save current body content
  const originalBodyContent = document.body.innerHTML;

  // Create a temporary container for printing, specifically marked with the print-only class
  const printWrapper = document.createElement("div");
  printWrapper.className = "receipt-print-wrapper print-only";

  // Clone the receipt content and append it to the wrapper
  printWrapper.appendChild(contentToPrint.cloneNode(true));

  // Replace body content
  document.body.innerHTML = "";
  document.body.appendChild(printWrapper);

  // Call print
  window.print();

  // Restore original content after a slight delay
  setTimeout(() => {
    document.body.innerHTML = originalBodyContent;
    // Re-establish event listeners by reloading data
    loadSalesData();
  }, 500);
};

// Handle date filter change to show/hide custom date inputs
function handleDateFilterChange() {
  const dateValue = dateFilter.value;

  if (dateValue === "custom") {
    customDateInputs.style.display = "block";
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    startDate.value = firstDay.toISOString().split("T")[0];
    endDate.value = lastDay.toISOString().split("T")[0];
  } else {
    customDateInputs.style.display = "none";
  }

  applyFilters();
}

// Filter sales data from the globally stored `allProcessedSalesData`
function filterSalesData() {
  applyFilters();
}

// Apply filters to sales data
function applyFilters() {
  const statusValue = statusFilter.value;
  const checkoutValue = checkoutFilter.value;
  const dateValue = dateFilter.value;

  let filteredData = [...allProcessedSalesData];

  if (statusValue !== "All") {
    filteredData = filteredData.filter((sale) => sale.status === statusValue);
  }

  if (checkoutValue !== "All") {
    filteredData = filteredData.filter(
      (sale) => sale.checkoutStatus === checkoutValue
    );
  }

  if (dateValue !== "all") {
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

    switch (dateValue) {
      case "today":
        break;
      case "tomorrow":
        filterStartDate = new Date(todayStart);
        filterStartDate.setDate(todayStart.getDate() + 1);
        filterEndDate = new Date(todayEnd);
        filterEndDate.setDate(todayEnd.getDate() + 1);
        break;
      case "week":
        filterStartDate = todayStart;
        filterEndDate = new Date(todayEnd);
        filterEndDate.setDate(todayEnd.getDate() + 6);
        break;
      case "month":
        filterStartDate = new Date(todayStart);
        filterStartDate.setMonth(todayStart.getMonth() - 1);
        break;
      case "year":
        filterStartDate = new Date(todayStart);
        filterStartDate.setFullYear(todayStart.getFullYear() - 1);
        break;
      case "custom":
        const startDateValue = startDate.value;
        const endDateValue = endDate.value;

        if (startDateValue && endDateValue) {
          filterStartDate = new Date(startDateValue);
          filterStartDate.setHours(0, 0, 0, 0);
          filterEndDate = new Date(endDateValue);
          filterEndDate.setHours(23, 59, 59, 999);
        } else {
          return;
        }
        break;
    }

    filteredData = filteredData.filter((sale) => {
      const saleDate = new Date(sale.date);
      if (isNaN(saleDate.getTime())) {
        return false;
      }
      return saleDate >= filterStartDate && saleDate <= filterEndDate;
    });
  }

  displaySalesData(filteredData);
  setupCheckboxListeners();
}

// View sale details
window.viewSaleDetails = function (saleId) {
  const sale = allProcessedSalesData.find((s) => s.id === saleId);
  if (!sale) {
    console.error("Sale not found for ID:", saleId);
    return;
  }

  const modalHeader = document.getElementById("modalHeader");
  const modalBody = document.getElementById("modalBody");

  modalHeader.textContent = `Sales Details - ${sale.transactionID}`;

  const bookingData = sale.fullBookingData;

  let detailsHtml = `
    <div class="user-details">
      <div class="info-section">
        <h3>Transaction Information</h3>
        <div class="info-group">
          <label>Transaction ID:</label>
          <span>${sale.transactionID}</span>
        </div>
        <div class="info-group">
          <label>Customer Name:</label>
          <span>${sale.customerName}</span>
        </div>
        <div class="info-group">
          <label>Service Type:</label>
          <span>${sale.serviceType}</span>
        </div>
        <div class="info-group">
          <label>Total Amount:</label>
          <span>₱${sale.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div class="info-group">
          <label>Down Payment:</label>
          <span>₱${sale.downPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div class="info-group">
          <label>Balance Due:</label>
          <span>₱${sale.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div class="info-group">
          <label>Payment Method:</label>
          <span>${sale.paymentMethod}</span>
        </div>
        <div class="info-group">
          <label>Date:</label>
          <span>${formatDate(sale.date)}</span>
        </div>
        <div class="info-group">
          <label>Booking Status:</label>
          <span class="status-badge status-${(sale.status || "pending").toLowerCase()}">${sale.status || "Pending"}</span>
        </div>
        <div class="info-group">
          <label>Payment Status:</label>
          <span class="status-badge status-${(sale.paymentStatus || "unpaid").toLowerCase()}">${sale.paymentStatus || "Unpaid"}</span>
        </div>
        <div class="info-group">
            <button class="action-btn btn-primary" onclick="window.showReceiptModal('${sale.id}')">
                <span style="color:white !important;">View & Print Receipt</span>
            </button>
        </div>
      </div>
  `;

  if (bookingData) {
    detailsHtml += `
      <div class="info-section">
        <h3>Owner Information</h3>
        <div class="info-group">
          <label>Owner Name:</label>
          <span>${sale.customerName}</span>
        </div>
        <div class="info-group">
          <label>Total Bookings by Owner:</label>
          <span>${sale.ownerBookingCount}</span>
        </div>
        <div class="info-group">
          <label>Email:</label>
          <span>${bookingData.ownerInformation?.email || "N/A"}</span>
        </div>
        <div class="info-group">
          <label>Contact No.:</label>
          <span>${bookingData.ownerInformation?.contactNo || "N/A"}</span>
        </div>
        <div class="info-group">
          <label>Address:</label>
          <span>${bookingData.ownerInformation?.address || "N/A"}</span>
        </div>
      </div>

      <div class="info-section">
        <h3>Pet Information</h3>
        <div class="info-group">
          <label>Pet Name:</label>
          <span>${bookingData.petInformation?.petName || "N/A"}</span>
        </div>
        <div class="info-group">
          <label>Pet Type:</label>
          <span>${bookingData.petInformation?.petType || "N/A"}</span>
        </div>
        <div class="info-group">
          <label>Pet Breed:</label>
          <span>${bookingData.petInformation?.petBreed || "N/A"}</span>
        </div>
        <div class="info-group">
          <label>Pet Size:</label>
          <span>${sale.petSize}</span>
        </div>
        <div class="info-group">
          <label>Pet Weight:</label>
          <span>${bookingData.petInformation?.petWeight || "N/A"} kg</span>
        </div>
        ${
          bookingData.serviceType === "Boarding"
            ? `
        <div class="info-group">
          <label>Pet Age:</label>
          <span>${bookingData.petInformation?.petAge || "N/A"}</span>
        </div>
        `
            : `
        <div class="info-group">
          <label>Pet Gender:</label>
          <span>${bookingData.petInformation?.petGender || "N/A"}</span>
        </div>
        <div class="info-group">
          <label>Date of Birth:</label>
          <span>${formatDate(bookingData.petInformation?.dateOfBirth) || "N/A"}</span>
        </div>
        <div class="info-group">
          <label>Colors/Markings:</label>
          <span>${bookingData.petInformation?.petColorsMarkings || "N/A"}</span>
        </div>
        `
        }
      </div>
      `;

    if (bookingData.serviceType === "Boarding") {
      detailsHtml += `
          <div class="info-section">
            <h3>Boarding Details</h3>
            <div class="info-group">
              <label>Check-in Date:</label>
              <span>${formatDate(bookingData.boardingDetails?.checkInDate) || "N/A"}</span>
            </div>
            <div class="info-group">
              <label>Check-out Date:</label>
              <span>${formatDate(bookingData.boardingDetails?.checkOutDate) || "N/A"}</span>
            </div>
            <div class="info-group">
              <label>Room Type:</label>
              <span>${bookingData.boardingDetails?.selectedRoomType || "N/A"}</span>
            </div>
            <div class="info-group">
              <label>Boarding Waiver Agreed:</label>
              <span>${bookingData.boardingDetails?.boardingWaiverAgreed ? "Yes" : "No"}</span>
            </div>
          </div>

          <div class="info-section">
            <h3>Feeding Details</h3>
            <div class="info-group">
              <label>Food Brand:</label>
              <span>${bookingData.feedingDetails?.foodBrand || "N/A"}</span>
            </div>
            <div class="info-group">
              <label>Number of Meals:</label>
              <span>${bookingData.feedingDetails?.numberOfMeals || "N/A"}</span>
            </div>
            <div class="info-group">
              <label>Morning Feeding:</label>
              <span>${bookingData.feedingDetails?.morningFeeding ? `Yes (${bookingData.feedingDetails?.morningTime || "N/A"})` : "No"}</span>
            </div>
            <div class="info-group">
              <label>Afternoon Feeding:</label>
              <span>${bookingData.feedingDetails?.afternoonFeeding ? `Yes (${bookingData.feedingDetails?.afternoonTime || "N/A"})` : "No"}</span>
            </div>
            <div class="info-group">
              <label>Evening Feeding:</label>
              <span>${bookingData.feedingDetails?.eveningFeeding ? `Yes (${bookingData.feedingDetails?.eveningTime || "N/A"})` : "No"}</span>
            </div>
          </div>

          <div class="info-section">
            <h3>Payment Details</h3>
            <div class="info-group">
              <label>Method:</label>
              <span>${bookingData.paymentDetails?.method || "N/A"}</span>
            </div>
            <div class="info-group">
              <label>Account No.:</label>
              <span>${bookingData.paymentDetails?.accountNumber || "N/A"}</span>
            </div>
            <div class="info-group">
              <label>Account Name:</label>
              <span>${bookingData.paymentDetails?.accountName || "N/A"}</span>
            </div>
            ${
              bookingData.paymentDetails?.receiptImageUrl
                ? `
            <div class="info-group">
              <label>Receipt:</label>
              <img src="${bookingData.paymentDetails.receiptImageUrl}" alt="Payment Receipt" style="max-width:100%; height:auto;">
            </div>
            `
                : ""
            }
          </div>
          `;
    } else if (bookingData.serviceType === "Grooming") {
      detailsHtml += `
          <div class="info-section">
            <h3>Grooming Details</h3>
            <div class="info-group">
              <label>Grooming Date:</label>
              <span>${formatDate(bookingData.groomingDetails?.groomingCheckInDate) || "N/A"}</span>
            </div>
            <div class="info-group">
              <label>Grooming Waiver Agreed:</label>
              <span>${bookingData.groomingDetails?.groomingWaiverAgreed ? "Yes" : "No"}</span>
            </div>
          </div>
          `;
    }

    let adminNotesArray = [];
    if (bookingData.adminNotes) {
      if (Array.isArray(bookingData.adminNotes)) {
        adminNotesArray = bookingData.adminNotes;
      } else if (typeof bookingData.adminNotes === "string") {
        adminNotesArray = [this.adminNotes];
      }
    }
    detailsHtml += `
      <div class="info-section">
        <h3>Admin Notes</h3>
        <p style="white-space: pre-wrap;">${adminNotesArray.join("\n") || "No notes provided."}</p>
      </div>
      `;
  }

  detailsHtml += `</div>`;

  modalBody.innerHTML = detailsHtml;

  const modal = document.getElementById("detailsModal");
  const overlay = document.getElementById("overlay");
  modal.style.display = "block";
  overlay.style.display = "block";
};

statusFilter.addEventListener("change", applyFilters);
checkoutFilter.addEventListener("change", applyFilters);
dateFilter.addEventListener("change", handleDateFilterChange);
refreshSalesBtn.addEventListener("click", loadSalesData);
startDate.addEventListener("change", applyFilters);
endDate.addEventListener("change", applyFilters);

document.addEventListener("DOMContentLoaded", function () {
  loadSalesData();
});

window.refreshSalesReports = loadSalesData;

function addSalesSummary(salesData) {
  const totalRevenue = salesData.reduce(
    (sum, sale) => sum + sale.totalAmount,
    0
  );
  const totalDownPayments = salesData.reduce(
    (sum, sale) => sum + sale.downPayment,
    0
  );
  // Total Balances is the sum of remaining amounts due
  const totalBalances = salesData.reduce((sum, sale) => sum + sale.balance, 0);

  // Total Collected is Revenue - Total Balances
  const totalCollected = totalRevenue - totalBalances;
  const totalOutstanding = totalBalances;

  const checkedOutCount = salesData.filter((sale) => sale.isCheckedOut).length;
  const pendingCount = salesData.filter((sale) => !sale.isCheckedOut).length;
  const paidCount = salesData.filter(
    (sale) => sale.paymentStatus === "Paid"
  ).length;
  const unpaidCount = salesData.filter(
    (sale) => sale.paymentStatus === "Unpaid"
  ).length;

  const summaryHTML = `
    <div class="no-print" style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
      <h3 style="color: #333; margin-bottom: 20px; border-bottom: 2px solid #ffb64a; padding-bottom: 10px;">Financial Summary</h3>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px;">
        <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #28a745;">
          <h4 style="color: #28a745; margin: 0 0 10px 0;">Total Revenue</h4>
          <p style="font-size: 1.5em; font-weight: bold; margin: 0; color: #333;">₱${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        
        <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #17a2b8;">
          <h4 style="color: #17a2b8; margin: 0 0 10px 0;">Total Collected</h4>
          <p style="font-size: 1.5em; font-weight: bold; margin: 0; color: #333;">₱${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        
        <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #dc3545;">
          <h4 style="color: #dc3545; margin: 0 0 10px 0;">Outstanding Balance</h4>
          <p style="font-size: 1.5em; font-weight: bold; margin: 0; color: #333;">₱${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        
        <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107;">
          <h4 style="color: #ffc107; margin: 0 0 10px 0;">Collection Rate</h4>
          <p style="font-size: 1.5em; font-weight: bold; margin: 0; color: #333;">${totalRevenue > 0 ? ((totalCollected / totalRevenue) * 100).toFixed(1) : 0}%</p>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
        <div style="text-align: center; padding: 10px; background: white; border-radius: 6px;">
          <h5 style="color: #28a745; margin: 0 0 5px 0;">Checked Out</h5>
          <p style="font-size: 1.2em; font-weight: bold; margin: 0; color: #333;">${checkedOutCount}</p>
        </div>
        
        <div style="text-align: center; padding: 10px; background: white; border-radius: 6px;">
          <h5 style="color: #ffc107; margin: 0 0 5px 0;">Pending</h5>
          <p style="font-size: 1.2em; font-weight: bold; margin: 0; color: #333;">${pendingCount}</p>
        </div>
        
        <div style="text-align: center; padding: 10px; background: white; border-radius: 6px;">
          <h5 style="color: #28a745; margin: 0 0 5px 0;">Paid</h5>
          <p style="font-size: 1.2em; font-weight: bold; margin: 0; color: #333;">${paidCount}</p>
        </div>
        
        <div style="text-align: center; padding: 10px; background: white; border-radius: 6px;">
          <h5 style="color: #dc3545; margin: 0 0 5px 0;">Unpaid</h5>
          <p style="font-size: 1.2em; font-weight: bold; margin: 0; color: #334;">${unpaidCount}</p>
        </div>
      </div>
      
      <div style="margin-top: 15px; padding: 10px; background: #e8f5e9; border-radius: 6px; border-left: 4px solid #28a745;">
        <p style="margin: 0; color: #2e7d32; font-size: 0.9em;">
          <strong>Note:</strong> The **Total Amount** for Checked-Out Boarding is now fixed to the **daily rate** ($\text{P}500/\text{P}600/\dots$), and the **Balance** is calculated based on this single-day amount. The payment status is always **Paid** upon checkout.
        </p>
      </div>
    </div>
  `;

  const tableContainer = document.querySelector(".table-container");
  if (tableContainer) {
    const existingSummary = tableContainer.nextElementSibling;
    if (existingSummary && existingSummary.style.marginTop === "30px") {
      existingSummary.remove();
    }
    tableContainer.insertAdjacentHTML("afterend", summaryHTML);
  }
}

// Function to update the state of the "Print Selected Rows" button
function updatePrintButtonState() {
  const selectedRowsCheckboxes = salesTableBody.querySelectorAll(
    ".row-select-checkbox:checked"
  );

  const selectedColumnCheckboxes = dataTableThead.querySelectorAll(
    ".column-select-checkbox:checked"
  );

  // The print button is enabled only if at least one row AND one column are selected
  if (
    selectedRowsCheckboxes.length > 0 &&
    selectedColumnCheckboxes.length > 0
  ) {
    printSelectedRowsBtn.disabled = false;
    printSelectedRowsBtn.classList.remove("print-button-disabled");
  } else {
    printSelectedRowsBtn.disabled = true;
    printSelectedRowsBtn.classList.add("print-button-disabled");
  }
}

// Function to set up the row and column checkbox event listeners
function setupCheckboxListeners() {
  // Row Checkboxes (in Tbody)
  const rowCheckboxes = salesTableBody.querySelectorAll(".row-select-checkbox");
  rowCheckboxes.forEach((checkbox) => {
    checkbox.removeEventListener("change", updatePrintButtonState); // Remove old listeners first
    checkbox.addEventListener("change", updatePrintButtonState);
  });

  // Column Checkboxes (in Thead)
  const columnCheckboxes = dataTableThead.querySelectorAll(
    ".column-select-checkbox"
  );
  columnCheckboxes.forEach((checkbox) => {
    checkbox.removeEventListener("change", updatePrintButtonState); // Remove old listeners first
    checkbox.addEventListener("change", updatePrintButtonState);
  });

  // Select All Rows Checkbox
  if (selectAllRowsCheckbox) {
    selectAllRowsCheckbox.removeEventListener("change", handleSelectAllChange);
    selectAllRowsCheckbox.addEventListener("change", handleSelectAllChange);
  }

  // Ensure print button listener is only added once
  if (!printSelectedRowsBtn.listenerAdded) {
    printSelectedRowsBtn.addEventListener("click", handlePrintSelectedRows);
    printSelectedRowsBtn.listenerAdded = true;
  }

  // Initial check to sync selectAll checkbox state
  const allRowsCheckboxes = salesTableBody.querySelectorAll(
    ".row-select-checkbox"
  );
  const checkedRowsCheckboxes = salesTableBody.querySelectorAll(
    ".row-select-checkbox:checked"
  );
  if (selectAllRowsCheckbox) {
    selectAllRowsCheckbox.checked =
      allRowsCheckboxes.length > 0 &&
      allRowsCheckboxes.length === checkedRowsCheckboxes.length;
  }

  updatePrintButtonState();
}

function handleSelectAllChange(e) {
  const allCheckboxes = salesTableBody.querySelectorAll(".row-select-checkbox");
  allCheckboxes.forEach((checkbox) => {
    checkbox.checked = e.target.checked;
  });
  updatePrintButtonState();
}

/**
 * Handles the logic for printing only selected rows and selected columns.
 */
function handlePrintSelectedRows() {
  const selectedRows = salesTableBody.querySelectorAll(
    ".row-select-checkbox:checked"
  );

  // 1. Determine which columns the user wants to print
  const selectedColumnKeys = Array.from(
    dataTableThead.querySelectorAll(".column-select-checkbox:checked")
  ).map((cb) => cb.getAttribute("data-column-key"));

  if (selectedRows.length === 0 || selectedColumnKeys.length === 0) {
    showWarningNotification(
      "Selection Required",
      "Please select at least one row and one column to print.",
      "Use the checkboxes in the table to select the data you want to print.",
      "⚠️"
    );
    return;
  }

  // Save current content to restore it later
  const originalBodyContent = document.body.innerHTML;
  const printContent = document.createElement("div");

  // Add a header for the printed report
  const printHeader = document.createElement("div");
  printHeader.className = "print-header";
  printHeader.innerHTML = `
      <h1>Sales Report</h1>
      <p class="meta">Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
    `;
  printContent.appendChild(printHeader);

  // Build the table for printing
  const originalTable = document.querySelector(".data-table");
  const printTable = originalTable.cloneNode(false); // Clone only the table structure
  printTable.style.minWidth = "initial"; // Remove min-width for printing
  const printThead = document.createElement("thead");
  const printTbody = document.createElement("tbody");
  printTable.appendChild(printThead);
  printTable.appendChild(printTbody);

  // 2. Build the new Header (THEAD) with only selected columns
  const headerRow = document.createElement("tr");

  // The first column in the original table is the row-select checkbox. We must skip it (index 0).
  const originalColumnHeaders = dataTableThead.querySelectorAll("th");

  originalColumnHeaders.forEach((originalTh, index) => {
    // Skip the first TH (the row selection checkbox header)
    if (index === 0) {
      // Add a simple '#' or blank TH for the row counter in print
      const printTh = document.createElement("th");
      printTh.textContent = "#";
      headerRow.appendChild(printTh);
      return;
    }

    const columnKey = originalTh.getAttribute("data-column");

    // Check if the column is selected AND is not the 'receipt' action column
    if (selectedColumnKeys.includes(columnKey) && columnKey !== "receipt") {
      const printTh = document.createElement("th");
      // Get the text content, ignoring the checkbox
      const headerText = originalTh.textContent.trim();
      printTh.textContent = headerText;
      headerRow.appendChild(printTh);
    }
  });
  printThead.appendChild(headerRow);

  // 3. Build the new Body (TBODY) with only selected rows and columns
  let rowCounter = 1;
  selectedRows.forEach((checkbox) => {
    const originalRow = checkbox.closest("tr");
    const printRow = document.createElement("tr");

    // Add the Row Counter TD
    const counterTd = document.createElement("td");
    counterTd.textContent = rowCounter++;
    printRow.appendChild(counterTd);

    // Iterate through the cells of the original row
    originalRow.querySelectorAll("td").forEach((originalTd, index) => {
      // Skip the first TD (the row selection checkbox)
      if (index === 0) return;

      const columnKey = originalTd.getAttribute("data-column");

      // Check if the column is selected AND is not the 'receipt' action column
      if (selectedColumnKeys.includes(columnKey) && columnKey !== "receipt") {
        const printTd = document.createElement("td");
        // Clone the content (including inner spans/badges)
        printTd.innerHTML = originalTd.innerHTML;
        printRow.appendChild(printTd);
      }
    });

    printTbody.appendChild(printRow);
  });

  printContent.appendChild(printTable);

  // Replace body content with only the content to be printed
  document.body.innerHTML = "";
  document.body.appendChild(printContent);

  // Call print
  window.print();

  // Restore original content after a slight delay
  setTimeout(() => {
    document.body.innerHTML = originalBodyContent;
    // Re-attach event listeners to the new DOM elements
    loadSalesData();
  }, 500);
}
