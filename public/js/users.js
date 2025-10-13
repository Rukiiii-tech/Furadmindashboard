// js/users.js
import {
  db,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from "./firebase-config.js";
import {
  showGenericModal,
  initializeModalCloseListeners,
} from "./modal_handler.js";
import { showErrorNotification } from "./notification-modal.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content Loaded for users.html");

  const usersTableBody = document.getElementById("usersTableBody");
  const detailsModal = document.getElementById("detailsModal");

  if (!usersTableBody) {
    console.error(
      'Error: Users table body element with ID "usersTableBody" not found in users.html. Cannot display users.'
    );
    return;
  }

  // Initialize modal close listeners for the detailsModal
  if (detailsModal) {
    initializeModalCloseListeners(
      detailsModal,
      "modalCloseBtn",
      "modalCloseBtnFooter"
    );
  }

  // Function to display user details in modal
  async function displayUserDetails(userId) {
    if (!userId) {
      console.error("User ID is missing. Cannot display details.");
      return;
    }

    let user;
    try {
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        user = userDocSnap.data();
        user.id = userDocSnap.id;
        console.log("Fetched User Details:", user);

        // Format user details for display
        const userDetailsHtml = `
          <div class="user-details">
            <div class="info-section">
              <h3>Personal Information</h3>
              <div class="info-group">
                <label>Full Name:</label>
                <span>${user.firstName || ""} ${user.lastName || ""}</span>
              </div>
              <div class="info-group">
                <label>Email:</label>
                <span><a href="mailto:${user.email || ""}">${user.email || "N/A"}</a></span>
              </div>
              <div class="info-group">
                <label>Contact Number:</label>
                <span>${user.contactNo || "N/A"}</span>
              </div>
              <div class="info-group">
                <label>Address:</label>
                <span>${user.address || "N/A"}</span>
              </div>
            </div>
            
            <div class="info-section">
              <h3>Account Information</h3>
              <div class="info-group">
                <label>User ID:</label>
                <span>${user.id}</span>
              </div>
              <div class="info-group">
                <label>Account Created:</label>
                <span>${user.createdAt ? new Date(user.createdAt.toDate()).toLocaleString() : "N/A"}</span>
              </div>
              <div class="info-group">
                <label>Last Updated:</label>
                <span>${user.updatedAt ? new Date(user.updatedAt.toDate()).toLocaleString() : "N/A"}</span>
              </div>
            </div>
          </div>
        `;

        // Show the modal with user details
        showGenericModal(
          detailsModal,
          `User Details: ${user.firstName || ""} ${user.lastName || ""}`,
          userDetailsHtml
        );
      } else {
        console.error("User details not found in Firestore for ID:", userId);
        showErrorNotification(
          "User Not Found",
          "User details not found.",
          "The user may have been deleted or the ID may be incorrect.",
          "❌"
        );
        return;
      }
    } catch (error) {
      console.error("Error fetching user details from Firestore:", error);
      showErrorNotification(
        "Error Loading User",
        "Failed to load user details: " + error.message,
        "Please check your internet connection and try again.",
        "❌"
      );
      return;
    }
  }

  console.log(
    "Attempting to set up onSnapshot listener for users collection..."
  );

  const usersQuery = query(
    collection(db, "users"),
    orderBy("createdAt", "desc")
  );

  onSnapshot(
    usersQuery,
    (snapshot) => {
      console.log(
        "onSnapshot callback fired for users. Number of documents received: ",
        snapshot.size
      );

      usersTableBody.innerHTML = "";
      let rowNumber = 1;

      if (snapshot.empty) {
        console.log(
          'Users collection is empty or no accessible documents. Displaying "No users found" message.'
        );
        const noDataRow = usersTableBody.insertRow();
        const noDataCell = noDataRow.insertCell();
        noDataCell.colSpan = 6;
        noDataCell.textContent =
          "No users found or accessible. Please check Firestore data and rules.";
        noDataCell.style.textAlign = "center";
        noDataCell.style.padding = "20px";
        return;
      }

      snapshot.forEach((documentSnapshot) => {
        const userData = documentSnapshot.data();
        const userId = documentSnapshot.id;
        // Only show users with role 'user'
        if (userData.role !== "user") {
          return;
        }
        console.log("Processing user document ID:", userId, "Data:", userData);

        const firstName = userData.firstName || "";
        const lastName = userData.lastName || "";
        const fullName = `${firstName} ${lastName}`.trim();
        const email = userData.email || "N/A";
        const contactNo = userData.contactNo || "N/A";
        const address = userData.address || "N/A";
        const isActive = userData.active !== undefined ? userData.active : true;

        const newRow = usersTableBody.insertRow();

        newRow.insertCell().textContent = rowNumber++;
        newRow.insertCell().textContent = fullName;

        const emailCell = newRow.insertCell();
        const emailLink = document.createElement("a");
        emailLink.href = `mailto:${email}`;
        emailLink.textContent = email;
        emailCell.appendChild(emailLink);

        newRow.insertCell().textContent = contactNo;
        newRow.insertCell().textContent = address;

        // Add status cell
        const statusCell = newRow.insertCell();
        const statusSpan = document.createElement("span");
        statusSpan.className =
          "status-badge " + (isActive ? "status-approved" : "status-rejected");
        statusSpan.textContent = isActive ? "Active" : "Inactive";
        statusCell.appendChild(statusSpan);

        // Add view button
        const actionCell = newRow.insertCell();
        const viewButton = document.createElement("button");
        viewButton.className = "action-btn btn-view";
        viewButton.textContent = "View Details";
        viewButton.addEventListener("click", () => {
          displayUserDetails(userId);
        });
        actionCell.appendChild(viewButton);
      });
      console.log("Successfully rendered users table with fetched data.");
    },
    (error) => {
      console.error(
        "Firestore Listener Error for users collection: ",
        error.code || error.message || error
      );
      usersTableBody.innerHTML =
        '<tr><td colspan="6" style="text-align: center; color: red; padding: 20px;">Error loading users: ' +
        (error.code || error.message || "Unknown error") +
        ". Please check console and Firestore Rules.</td></tr>";
    }
  );
});
