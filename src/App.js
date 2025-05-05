import { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import SubmitTicket from "./pages/SubmitTicket";
import AdminDashboard from "./pages/AdminDashboard";
import OutletDashboard from "./pages/OutletDashboard";

export default function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role");

    if (role === "admin") {
      navigate("/admin");
    } else if (role === "outlet") {
      navigate("/dashboard");
    }
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/submit" element={<OutletDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/dashboard" element={<OutletDashboard />} />
    </Routes>
  );
}
