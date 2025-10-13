// js/modal_handler.js

/**
 * Global variable to store the resolve function for the current modal promise.
 * Used to control the flow of asynchronous operations when a modal requires confirmation.
 */
let currentModalResolve = null;

/**
 * Ensures the global overlay exists in the DOM.
 */
export function createOverlay() {
  let overlay = document.getElementById("overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "overlay";
    overlay.className = "overlay";
    document.body.appendChild(overlay);
  }
}

/**
 * Displays a generic modal with custom content and optional confirmation buttons.
 * @param {HTMLElement} modalElement - The main modal container element (e.g., document.getElementById('detailsModal')).
 * @param {string} [title] - The title to display in the modal header.
 * @param {string} [bodyHtml] - The HTML content to display in the modal body.
 * @param {HTMLElement} [bodyContentTarget=modalElement.querySelector('.modal-body')] - The specific element within the modal body where bodyHtml should be inserted. Defaults to the first .modal-body found.
 * @param {boolean} [showConfirmationButtons=false] - If true, "Confirm" and "Cancel" buttons are shown in the footer.
 * @returns {Promise<boolean>} Resolves to true if confirmed, false if cancelled/closed.
 */
export function showGenericModal(
  modalElement,
  title = null,
  bodyHtml = null,
  bodyContentTarget = null,
  showConfirmationButtons = false
) {
  return new Promise((resolve) => {
    currentModalResolve = resolve; // Store the resolve function

    const modalHeader = modalElement.querySelector(".modal-header h2");
    const modalBody =
      bodyContentTarget || modalElement.querySelector(".modal-body");
    const modalFooter = modalElement.querySelector(".modal-footer");

    if (title && modalHeader) {
      modalHeader.textContent = title;
    }
    if (bodyHtml && modalBody) {
      modalBody.innerHTML = bodyHtml;
    }

    // Clear existing buttons to prevent duplicates
    modalFooter.innerHTML = "";

    if (showConfirmationButtons) {
      const confirmButton = document.createElement("button");
      confirmButton.id = "modalConfirmBtn";
      confirmButton.className = "btn btn-primary";
      confirmButton.textContent = "Confirm";
      confirmButton.addEventListener("click", () => {
        hideGenericModal(modalElement);
        currentModalResolve(true); // Resolve with true on confirm
      });
      modalFooter.appendChild(confirmButton);

      const cancelButton = document.createElement("button");
      cancelButton.id = "modalCancelBtn";
      cancelButton.className = "btn btn-secondary";
      cancelButton.textContent = "Cancel";
      cancelButton.addEventListener("click", () => {
        hideGenericModal(modalElement);
        currentModalResolve(false); // Resolve with false on cancel
      });
      modalFooter.appendChild(cancelButton);
    } else {
      // If no confirmation buttons, show a single "Close" button
      const closeButton = document.createElement("button");
      closeButton.id = "modalCloseBtnFooter";
      closeButton.className = "btn btn-secondary";
      closeButton.textContent = "Close";
      closeButton.addEventListener("click", () => {
        hideGenericModal(modalElement);
        currentModalResolve(false); // Resolve with false as it's just a close
      });
      modalFooter.appendChild(closeButton);
    }

    // Show the modal and overlay
    modalElement.style.display = "flex";
    document.getElementById("overlay").style.display = "block";

    // Re-initialize close listeners for the 'x' button and overlay click
    initializeModalCloseListeners(
      modalElement,
      "modalCloseBtn" // The 'x' button in the header
      // The footer close button is now dynamically added and handled within showGenericModal
    );
  });
}

/**
 * Hides the currently displayed generic modal and its overlay.
 * @param {HTMLElement} modalElement - The main modal container element to hide.
 */
export function hideGenericModal(modalElement) {
  modalElement.style.display = "none";
  document.getElementById("overlay").style.display = "none";
  currentModalResolve = null; // Clear the resolve function
}

/**
 * Initializes event listeners for closing modals. This should be called once per modal.
 * It attaches listeners to the header close button ('x') and the overlay.
 * The footer close button is handled dynamically by showGenericModal.
 * @param {HTMLElement} modalElement - The modal element to attach listeners to.
 * @param {string} headerCloseBtnId - The ID of the close button in the modal header.
 */
export function initializeModalCloseListeners(modalElement, headerCloseBtnId) {
  const headerCloseBtn = modalElement.querySelector(`#${headerCloseBtnId}`);
  const overlay = document.getElementById("overlay");

  if (headerCloseBtn) {
    headerCloseBtn.addEventListener("click", () => {
      hideGenericModal(modalElement);
      // If a promise is pending from showGenericModal, resolve it as false (cancelled)
      if (currentModalResolve) {
        currentModalResolve(false);
      }
    });
  }

  if (overlay) {
    overlay.addEventListener("click", (e) => {
      // Only hide if the click is directly on the overlay, not on the modal content
      if (e.target === overlay) {
        hideGenericModal(modalElement);
        // If a promise is pending from showGenericModal, resolve it as false (cancelled)
        if (currentModalResolve) {
          currentModalResolve(false);
        }
      }
    });
  }
}

// Call createOverlay once globally to ensure it's always available
createOverlay();
