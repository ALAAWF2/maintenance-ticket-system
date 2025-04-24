import { Routes, Route } from "react-router-dom";
import Login from "./Login";
import SubmitTicket from "./SubmitTicket";
import AdminDashboard from "./AdminDashboard"; // تأكد أن الملف موجود فعلاً
import OutletDashboard from "./OutletDashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/submit" element={<OutletDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/dashboard" element={<OutletDashboard />} />

    </Routes>
  );
}
