import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Navigate, useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [outletFilter, setOutletFilter] = useState("all");
  const [sortDirection, setSortDirection] = useState("desc");
  const [redirect, setRedirect] = useState(false);
  const navigate = useNavigate();

  const role = localStorage.getItem("role");

  useEffect(() => {
    if (role !== "admin") {
      setRedirect(true);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, "tickets"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTickets(data);
    });
    return () => unsubscribe();
  }, [role]);

  if (redirect) return <Navigate to="/" />;

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const updateStatus = async (id, newStatus) => {
    const updates = { status: newStatus };
    if (newStatus === "جاري التنفيذ") {
      updates.startedAt = serverTimestamp();
    } else if (newStatus === "تم التنفيذ") {
      updates.adminConfirmedAt = serverTimestamp();
    }
    await updateDoc(doc(db, "tickets", id), updates);
  };

  const deleteTicket = async (id) => {
    const confirm = window.confirm("هل أنت متأكد أنك تريد حذف هذه التذكرة؟ ❌");
    if (!confirm) return;
    try {
      await deleteDoc(doc(db, "tickets", id));
      alert("✅ تم حذف التذكرة");
    } catch (error) {
      console.error("Error deleting ticket:", error);
      alert("❌ حدث خطأ أثناء الحذف");
    }
  };

  const formatDate = (ts) => {
    if (!ts) return "-";
    const date = ts.toDate();
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const uniqueOutlets = [...new Set(tickets.map((t) => t.outlet))];

  const filteredTickets = tickets
    .filter((t) => {
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      const matchOutlet = outletFilter === "all" || t.outlet === outletFilter;
      return matchStatus && matchOutlet;
    })
    .sort((a, b) => {
      const aTime = a.createdAt?.toDate()?.getTime() || 0;
      const bTime = b.createdAt?.toDate()?.getTime() || 0;
      return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
    });

  const countByStatus = (status) =>
    tickets.filter((t) => t.status === status).length;

  const exportToExcel = () => {
    const data = filteredTickets.map((t) => ({
      Outlet: t.outlet,
      "Issue Type": t.issueType,
      Description: t.description,
      Status: t.status,
      "Created At": formatDate(t.createdAt),
      "Started At": formatDate(t.startedAt),
      "Confirmed by Outlet": formatDate(t.outletConfirmedAt),
    }));
    const sheet = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Tickets");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const file = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(file, `maintenance_tickets.xlsx`);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "auto", background: "#fffaf3" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ color: "#f97316" }}>لوحة إدارة التذاكر</h2>
        <button onClick={handleLogout} style={btnLogout}>🚪 تسجيل الخروج</button>
      </div>

      <div style={{ margin: "1rem 0", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
        <span>📌 الإجمالي: {tickets.length}</span>
        <span>🟠 جديدة: {countByStatus("جديدة")}</span>
        <span>🔵 جاري التنفيذ: {countByStatus("جاري التنفيذ")}</span>
        <span>🟢 تم التنفيذ: {countByStatus("تم التنفيذ")}</span>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
          <option value="all">كل الحالات</option>
          <option value="جديدة">جديدة</option>
          <option value="جاري التنفيذ">جاري التنفيذ</option>
          <option value="تم التنفيذ">تم التنفيذ</option>
        </select>

        <select value={outletFilter} onChange={(e) => setOutletFilter(e.target.value)} style={selectStyle}>
          <option value="all">كل المعارض</option>
          {uniqueOutlets.map((outlet) => (
            <option key={outlet} value={outlet}>{outlet}</option>
          ))}
        </select>

        <button onClick={exportToExcel} style={btnExport}>📥 تصدير Excel</button>
        <button
          onClick={() => setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))}
          style={{ ...btnExport, backgroundColor: "#3b82f6" }}
        >
          🔃 ترتيب حسب التاريخ ({sortDirection === "asc" ? "تصاعدي" : "تنازلي"})
        </button>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
        <thead style={{ backgroundColor: "#fde8cd" }}>
          <tr>
            <th style={thStyle}>المعرض</th>
            <th style={thStyle}>نوع المشكلة</th>
            <th style={thStyle}>الوصف</th>
            <th style={thStyle}>الحالة</th>
            <th style={thStyle}>تاريخ الإنشاء</th>
            <th style={thStyle}>بدأ التنفيذ</th>
            <th style={thStyle}>تأكيد المعرض</th>
            <th style={thStyle}>حذف</th>
          </tr>
        </thead>
        <tbody>
          {filteredTickets.map((ticket) => (
            <tr key={ticket.id} style={{ textAlign: "center", background: "#fff" }}>
              <td style={tdStyle}>{ticket.outlet}</td>
              <td style={tdStyle}>{ticket.issueType}</td>
              <td style={tdStyle}>{ticket.description}</td>
              <td style={tdStyle}>
                <select
                  value={ticket.status}
                  onChange={(e) => updateStatus(ticket.id, e.target.value)}
                  style={{
                    padding: "0.4rem",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                    background: "#fffaf3",
                    fontWeight: "bold",
                  }}
                >
                  <option value="جديدة">جديدة</option>
                  <option value="جاري التنفيذ">جاري التنفيذ</option>
                  <option value="تم التنفيذ">تم التنفيذ</option>
                </select>
              </td>
              <td style={tdStyle}>{formatDate(ticket.createdAt)}</td>
              <td style={tdStyle}>{formatDate(ticket.startedAt)}</td>
              <td style={tdStyle}>{formatDate(ticket.outletConfirmedAt)}</td>
              <td style={tdStyle}>
                <button
                  onClick={() => deleteTicket(ticket.id)}
                  style={{
                    backgroundColor: "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "0.4rem 0.6rem",
                    cursor: "pointer",
                  }}
                >
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = { padding: "10px", border: "1px solid #ddd", background: "#fff4e3" };
const tdStyle = { padding: "8px", border: "1px solid #eee" };
const selectStyle = { padding: "0.5rem", fontSize: "1rem", borderRadius: "5px", backgroundColor: "#fff8ef" };
const btnExport = {
  backgroundColor: "#f59e0b",
  color: "white",
  padding: "0.5rem 1rem",
  border: "none",
  borderRadius: "5px",
  fontWeight: "bold",
  cursor: "pointer",
};
const btnLogout = {
  backgroundColor: "#ef4444",
  color: "white",
  padding: "0.5rem 1rem",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontWeight: "bold",
};
