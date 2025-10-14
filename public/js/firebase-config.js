// Import Firebase SDK modules from version 12.4.0
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  updateDoc,
  Timestamp,
  where,
  deleteDoc,
  addDoc,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDwkilaO0lkU42PWBewZ-Bi46rjpsLnVrg",
  authDomain: "furrytails-bb67e.firebaseapp.com",
  projectId: "furrytails-bb67e",
  storageBucket: "furrytails-bb67e.firebasestorage.app",
  messagingSenderId: "896556655663",
  appId: "1:896556655663:web:2c1f70b39f2daa2f4a12da",
  measurementId: "G-V2VX2EKS5G",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Initialize analytics
const auth = getAuth(app); // Initialize Auth
const db = getFirestore(app); // Initialize Firestore

// --- Authentication Functions ---

/**
 * Handles user login for the admin dashboard.
 * Includes a check for 'admin' role from Firestore.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @returns {Promise<{success: boolean, error?: string, user?: object}>} Result of the login attempt.
 */
async function loginUser(email, password) {
  try {
    console.log(`Attempting to log in user: ${email}`);
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    if (!user) {
      console.error("No user returned after successful authentication");
      return {
        success: false,
        error: "Login failed: User object not found after authentication.",
      };
    }

    console.log(
      `User ${user.email} authenticated via Firebase Auth. Checking Firestore role...`
    );

    // Fetch the user's document from Firestore to check their role
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      console.warn(
        "User authenticated but no Firestore document found for UID:",
        user.uid
      );
      await signOut(auth);
      return {
        success: false,
        error:
          "Access denied. User profile not found or incorrectly configured.",
      };
    }

    const userData = userDocSnap.data();
    console.log(`Firestore user data for ${user.email}:`, userData);

    if (userData.role !== "admin") {
      console.warn(
        "Non-admin user attempted login to dashboard:",
        user.email,
        "Role:",
        userData.role
      );
      await signOut(auth);
      return {
        success: false,
        error: "Access denied. Only administrators can log in here.",
      };
    }

    console.log("Admin login successful for:", user.email);
    return { success: true, user: user };
  } catch (error) {
    console.error(
      "Firebase Auth Error during login:",
      error.code,
      error.message
    );

    let errorMessage = "Login failed. Please check your credentials.";
    switch (error.code) {
      case "auth/invalid-email":
        errorMessage = "Invalid email address format.";
        break;
      case "auth/user-disabled":
        errorMessage = "Your account has been disabled.";
        break;
      case "auth/user-not-found":
      case "auth/wrong-password":
        errorMessage = "Incorrect email or password.";
        break;
      case "auth/network-request-failed":
        errorMessage = "Network error. Please check your internet connection.";
        break;
      case "auth/too-many-requests":
        errorMessage = "Too many login attempts. Please try again later.";
        break;
      default:
        errorMessage =
          error.message || "An unknown authentication error occurred.";
    }
    return { success: false, error: errorMessage };
  }
}

/**
 * Handles user logout.
 * @returns {Promise<{success: boolean, error?: string}>} Result of the logout attempt.
 */
async function logoutUser() {
  try {
    await signOut(auth);
    console.log("User signed out successfully.");
    return { success: true };
  } catch (error) {
    console.error("Error signing out:", error);
    return { success: false, error: error.message || "Failed to sign out." };
  }
}

// Export the functions and instances for other modules
export {
  loginUser,
  logoutUser,
  auth,
  onAuthStateChanged,
  db,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  where,
  deleteDoc,
  addDoc,
};
