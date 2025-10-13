import React from "react";
import BookingsList from "./BookingsList";
import UserAccountsList from "./User AccountsList";
import FacilitatorProfilesList from "./FacilitatorProfilesList";

const AdminDashboard = () => {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <h2>Bookings</h2>
      <BookingsList />
      <h2>User Accounts</h2>
      <User AccountsList />
      <h2>Facilitator Profiles</h2>
      <FacilitatorProfilesList />
    </div>
  );
};

export default AdminDashboard;
