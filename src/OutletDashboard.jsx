import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  updateDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { Navigate, useNavigate } from "react-router-dom";

export default function OutletDashboard() {
  const [form, setForm] = useState({ issueType: "", description: "" });
  const [tickets, setTickets] = useState([]);
  const [redirect, setRedirect] = useState(false);

  const outlet = localStorage.getItem("outlet");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  useEffect(() => {
    if (!outlet || role === "admin") {
      setRedirect(true);
      return;
    }

    const q = query(collection(db, "tickets"), where("outlet", "==", outlet));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTickets(data);
    });
    return () => unsubscribe();
  }, [outlet, role]);

  if (redirect) return <Navigate to="/" />;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "tickets"), {
      outlet,
      issueType: form.issueType,
      description: form.description,
      status: "جديدة",
      createdAt: serverTimestamp(),
    });
    setForm({ issueType: "", description: "" });
  };

  const updateStatus = async (id) => {
    await updateDoc(doc(db, "tickets", id), {
      status: "تم التنفيذ",
      outletConfirmedAt: serverTimestamp(),
    });
  };

  const handleImageUpload = (ticketId) => {
    alert("📷 سيتم دعم رفع الصور بعد تفعيل Firebase Storage.");
  };

  const formatDate = (ts) => {
    if (!ts) return "-";
    const date = ts.toDate();
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1000px", margin: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ color: "#f97316", marginBottom: "0.5rem" }}>تذاكر الصيانة الخاصة بمعرضك</h2>
        <button onClick={handleLogout} style={btnLogout}>🚪 تسجيل الخروج</button>
      </div>
      <p style={{ textAlign: "center", color: "#444", marginBottom: "2rem" }}>
        المعرض الحالي: <strong>{outlet}</strong>
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}
      >
        <select
          name="issueType"
          value={form.issueType}
          onChange={handleChange}
          required
          style={{ padding: "0.5rem", fontSize: "1rem" }}
        >
          <option value="">اختر نوع المشكلة</option>
          <option value="أعمال تكييف">أعمال تكييف</option>
          <option value="أعمال إنارة">أعمال إنارة</option>
          <option value="أعمال طلاء">أعمال طلاء</option>
          <option value="أعمال خشب">أعمال خشب</option>
          <option value="أخرى">أخرى</option>
        </select>

        <textarea
          name="description"
          placeholder="وصف المشكلة"
          value={form.description}
          onChange={handleChange}
          required
          style={{ padding: "0.5rem", fontSize: "1rem", resize: "vertical", minHeight: "80px" }}
        />
        <button
          type="submit"
          style={{
            backgroundColor: "#f97316",
            color: "white",
            padding: "0.75rem",
            fontSize: "1rem",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          إرسال تذكرة جديدة
        </button>
      </form>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
        <thead style={{ backgroundColor: "#f2f2f2" }}>
          <tr>
            <th style={thStyle}>نوع المشكلة</th>
            <th style={thStyle}>الوصف</th>
            <th style={thStyle}>الحالة</th>
            <th style={thStyle}>تاريخ الإنشاء</th>
            <th style={thStyle}>بدأ التنفيذ</th>
            <th style={thStyle}>تم التأكيد</th>
            <th style={thStyle}>إجراء</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id} style={{ textAlign: "center", borderTop: "1px solid #eee" }}>
              <td style={tdStyle}>{ticket.issueType}</td>
              <td style={tdStyle}>{ticket.description}</td>
              <td style={tdStyle}>{ticket.status}</td>
              <td style={tdStyle}>{formatDate(ticket.createdAt)}</td>
              <td style={tdStyle}>{formatDate(ticket.startedAt)}</td>
              <td style={tdStyle}>{formatDate(ticket.outletConfirmedAt)}</td>
              <td style={tdStyle}>
                {ticket.status === "جاري التنفيذ" && (
                  <button
                    onClick={() => updateStatus(ticket.id)}
                    style={btnGreen}
                  >
                    تأكيد التنفيذ
                  </button>
                )}
                {ticket.status === "تم التنفيذ" && (
                  <button
                    onClick={() => handleImageUpload(ticket.id)}
                    style={btnBlue}
                  >
                    إضافة صور
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = { padding: "10px", border: "1px solid #ddd", background: "#fafafa" };
const tdStyle = { padding: "8px", border: "1px solid #ddd" };
const btnGreen = {
  backgroundColor: "#16a34a",
  color: "white",
  padding: "0.5rem",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};
const btnBlue = {
  backgroundColor: "#3b82f6",
  color: "white",
  padding: "0.5rem",
  border: "none",
  borderRadius: "4px",
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
