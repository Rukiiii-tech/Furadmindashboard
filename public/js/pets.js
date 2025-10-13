// pets.js
import {
  auth,
  db,
  collection,
  query,
  onSnapshot,
  orderBy,
  where,
  doc,
  getDoc,
  getDocs,
} from "./firebase-config.js";

// Import showGenericModal from modal_handler.js
import { showGenericModal } from "./modal_handler.js";

// Function to format the pet's weight
function formatWeight(weight) {
  if (typeof weight === "number") {
    return `${weight} kg`;
  }
  return weight ? String(weight) : "N/A";
}

// Function to convert kg to grams
function convertKgToGrams(weightKg) {
  // Ensure weightKg is a number for calculation
  const numericWeight = parseFloat(weightKg);
  if (!isNaN(numericWeight)) {
    return `${numericWeight * 1000} grams`;
  }
  return "N/A";
}

async function loadPetsData() {
  const petsTableBody = document.getElementById("petsTableBody");
  if (!petsTableBody) {
    console.error("Error: Pets table body element not found.");
    return;
  }

  // Set initial loading message, adjusting colspan for the total number of columns
  // COLSPAN ADJUSTED to 12 (original 9 + 3 new columns)
  petsTableBody.innerHTML = `
    <tr>
      <td colspan="12" style="text-align: center; padding: 20px;">
        Loading pet details...
      </td>
    </tr>
  `;

  try {
    // Fetch all pet documents from the 'petsp' collection
    const petsSnapshot = await getDocs(collection(db, "petsp"));

    if (petsSnapshot.empty) {
      petsTableBody.innerHTML = `
        <tr>
          <td colspan="12" style="text-align: center; padding: 20px">No pet details found.</td>
        </tr>
      `;
      return;
    }

    const petsData = [];
    for (const petDoc of petsSnapshot.docs) {
      const pet = petDoc.data();

      let ownerFullName = "N/A";
      if (pet.ownerUserId) {
        const ownerDoc = await getDoc(doc(db, "users", pet.ownerUserId));
        if (ownerDoc.exists()) {
          const ownerData = ownerDoc.data();
          ownerFullName =
            `${ownerData.firstName || ""} ${ownerData.lastName || ""}`.trim();
        }
      }

      petsData.push({
        id: petDoc.id, // The document ID of the pet itself
        ownerFullName: ownerFullName, //
        petName: pet.petName || "N/A",
        petType: pet.petType || "N/A",
        petBreed: pet.petBreed || "N/A",
        petGender: pet.petGender || "N/A",
        petWeight: pet.petWeight || "N/A",
        birthdate: pet.dateOfBirth || "N/A",
        cageType: pet.cageType || "N/A", // 'cageType' from petsp
        petColorsMarkings: pet.petColorsMarkings || "N/A", // From petsp
        // Feeding schedule details from petsp (for modal)
        morningFeeding: pet.morningFeeding || false,
        morningTime: pet.morningTime || "N/A",
        afternoonFeeding: pet.afternoonFeeding || false,
        afternoonTime: pet.afternoonTime || "N/A",
        eveningFeeding: pet.eveningFeeding || false,
        eveningTime: pet.eveningTime || "N/A",
        // Image URLs from petsp
        vaccinationImage: pet.vaccinationRecordImageUrl || null,
        petProfileImage: pet.petProfileImageUrl || null,
      });
    }

    if (petsData.length === 0) {
      petsTableBody.innerHTML = `
        <tr>
          <td colspan="12" style="text-align: center; padding: 20px">No pet details found.</td> </tr>
      `;
      return;
    }

    petsTableBody.innerHTML = ""; // Clear the loading message

    // Render table rows from the fetched petsData
    petsData.forEach((petDetails) => {
      const row = petsTableBody.insertRow();
      // Populate table cells with all the required data
      row.insertCell().textContent = petDetails.ownerFullName;
      row.insertCell().textContent = petDetails.petName;
      row.insertCell().textContent = petDetails.petBreed;
      row.insertCell().textContent = petDetails.petGender;
      row.insertCell().textContent = formatWeight(petDetails.petWeight);
      row.insertCell().textContent = petDetails.birthdate;
      row.insertCell().textContent = petDetails.cageType;

      // Add Actions column with View Details button
      const actionsCell = row.insertCell();
      const viewButton = document.createElement("button");
      viewButton.textContent = "View Details";
      viewButton.classList.add("action-btn", "btn-view");
      viewButton.onclick = () => showPetDetailsModal(petDetails);
      actionsCell.appendChild(viewButton);
    });

    console.log(
      "Pet data loaded from 'petsp' collection successfully for admin."
    );
  } catch (initialError) {
    console.error("Error loading pets data from 'petsp':", initialError);
    const petsTableBody = document.getElementById("petsTableBody");
    if (petsTableBody) {
      petsTableBody.innerHTML = `
        <tr>
          <td colspan="12" style="text-align: center; padding: 20px; color: red"> Failed to load pet data. Error: ${initialError.message || initialError}.
          </td>
        </tr>
      `;
    }
  }
}

// Function to show pet details in the modal (UPDATED to use showGenericModal and full details)
function showPetDetailsModal(details) {
  const modalElement = document.getElementById("petDetailsModal");
  const modalBodyContentElement = document.getElementById("petDetailsBody");

  // Calculate total pet grams from petWeight here for display in modal
  const totalPetGramsFromWeight = convertKgToGrams(
    parseFloat(details.petWeight)
  );

  // Construct the HTML for the modal body with structured sections and all details
  let detailsHtml = `
    <div class="modal-section">
      <h3>Owner Information</h3>
      <div class="info-item">
        <strong>Owner Name:</strong> <p>${details.ownerFullName}</p>
      </div>
    </div>

    <div class="modal-section">
      <h3>Pet Information</h3>
      <div class="info-item">
        <strong>Pet Name:</strong> <p>${details.petName}</p>
      </div>
      <div class="info-item">
        <strong>Pet Type:</strong> <p>${details.petType}</p>
      </div>
      <div class="info-item">
        <strong>Pet Breed:</strong> <p>${details.petBreed}</p>
      </div>
      <div class="info-item">
        <strong>Pet Gender:</strong> <p>${details.petGender}</p>
      </div>
      <div class="info-item">
        <strong>Pet Weight:</strong> <p>${formatWeight(details.petWeight)}</p>
      </div>
      <div class="info-item">
        <strong>Total Pet Food Grams (from weight):</strong> <p>${totalPetGramsFromWeight}</p>
      </div>
      <div class="info-item">
        <strong>Birthdate:</strong> <p>${details.birthdate}</p>
      </div>
      <div class="info-item">
        <strong>Colors/Markings:</strong> <p>${details.petColorsMarkings}</p>
      </div>
      ${
        details.petProfileImage
          ? `
      <div class="image-container">
        <strong>Pet Profile Image:</strong>
        <img src="${details.petProfileImage}" alt="Pet Profile Image" class="booking-image" onclick="window.open('${details.petProfileImage}', '_blank')">
      </div>`
          : `<div class="info-item"><strong>Pet Profile Image:</strong> <p>No image provided</p></div>`
      }
    </div>

    <div class="modal-section">
      <h3>Feeding Details</h3>
      <div class="info-item">
        <strong>Cage Type:</strong> <p>${details.cageType}</p>
      </div>
      ${
        details.morningFeeding
          ? `
      <div class="info-item">
        <strong>Morning Feed Time:</strong> <p>${details.morningTime}</p>
      </div>
      <div class="info-item">
        <strong>Morning Food Grams:</strong> <p>${details.morningFoodGrams} grams</p>
      </div>`
          : ""
      }
      ${
        details.afternoonFeeding
          ? `
      <div class="info-item">
        <strong>Afternoon Feed Time:</strong> <p>${details.afternoonTime}</p>
      </div>
      <div class="info-item">
        <strong>Afternoon Food Grams:</strong> <p>${details.afternoonFoodGrams} grams</p>
      </div>`
          : ""
      }
      ${
        details.eveningFeeding
          ? `
      <div class="info-item">
        <strong>Evening Feed Time:</strong> <p>${details.eveningTime}</p>
      </div>
      <div class="info-item">
        <strong>Evening Food Grams:</strong> <p>${details.eveningFoodGrams} grams</p>
      </div>`
          : ""
      }
    </div>

    <div class="modal-section">
      <h3>Vaccination Record</h3>
      ${
        details.vaccinationImage
          ? `
      <div class="image-container">
        <strong>Vaccination Record Image:</strong>
        <img src="${details.vaccinationImage}" alt="Vaccination Record" class="booking-image" onclick="window.open('${details.vaccinationImage}', '_blank')">
      </div>`
          : `<div class="info-item"><strong>Vaccination Record:</strong> <p>Not provided</p></div>`
      }
    </div>
  `;

  // Use showGenericModal to display the content
  showGenericModal(
    modalElement,
    `Pet Details for ${details.petName}`,
    detailsHtml,
    modalBodyContentElement
  );
}

// Check authentication and load data when the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log("User authenticated. Loading pets data for admin page...");
      loadPetsData();
    } else {
      console.log("User not authenticated. Redirecting to index.html.");
      window.location.href = "index.html";
    }
  });
});

// Optional: Clean up the listener when the page is unloaded (if using onSnapshot for real-time updates)
window.addEventListener("beforeunload", () => {
  if (window.petsUnsubscribe) {
    window.petsUnsubscribe();
    console.log("Cleaned up pets data listener.");
  }
});
