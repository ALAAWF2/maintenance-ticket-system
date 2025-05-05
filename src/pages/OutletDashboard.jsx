import { useState, useEffect } from "react";
import { db } from "../services/firebase";
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
import { Box, Typography, Button, Snackbar, Alert, Paper, Grid, Chip, AppBar, Toolbar, Container } from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import FiberNewIcon from '@mui/icons-material/FiberNew';

const tajawalFont = {
  fontFamily: 'Tajawal, Arial, sans-serif',
};

export default function OutletDashboard() {
  const [form, setForm] = useState({ issueType: "", description: "" });
  const [tickets, setTickets] = useState([]);
  const [redirect, setRedirect] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

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
    try {
      await addDoc(collection(db, "tickets"), {
        outlet,
        issueType: form.issueType,
        description: form.description,
        status: "جديدة",
        createdAt: serverTimestamp(),
      });
      setForm({ issueType: "", description: "" });
      setSnackbar({ open: true, message: 'تم إرسال التذكرة بنجاح', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'حدث خطأ أثناء إرسال التذكرة', severity: 'error' });
    }
  };

  const updateStatus = async (id) => {
    try {
      await updateDoc(doc(db, "tickets", id), {
        status: "تم التنفيذ",
        outletConfirmedAt: serverTimestamp(),
      });
      setSnackbar({ open: true, message: 'تم تأكيد التنفيذ', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'حدث خطأ أثناء التأكيد', severity: 'error' });
    }
  };

  const handleImageUpload = (ticketId) => {
    setSnackbar({ open: true, message: '📷 سيتم دعم رفع الصور قريباً', severity: 'info' });
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

  // عدادات الحالات
  const countByStatus = (status) => tickets.filter((t) => t.status === status).length;

  // ألوان الحالات
  const statusColor = (status) => {
    if (status === "جديدة") return "warning";
    if (status === "جاري التنفيذ") return "info";
    if (status === "تم التنفيذ") return "success";
    return "default";
  };

  // أيقونات الحالات
  const statusIcon = (status) => {
    if (status === "جديدة") return <FiberNewIcon fontSize="small" sx={{ mr: 0.5 }} />;
    if (status === "جاري التنفيذ") return <HourglassBottomIcon fontSize="small" sx={{ mr: 0.5 }} />;
    if (status === "تم التنفيذ") return <CheckCircleIcon fontSize="small" sx={{ mr: 0.5 }} />;
    return null;
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "#f8fafc", pb: 4 }}>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet" />
      {/* شريط علوي */}
      <AppBar position="static" sx={{ background: "#f97316", mb: 4 }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6" sx={{ ...tajawalFont, fontWeight: 700 }}>
            {outlet}
          </Typography>
          <Button color="inherit" onClick={handleLogout} sx={{ fontWeight: "bold", ...tajawalFont }}>
            تسجيل الخروج
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md">
        {/* عدادات */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: "center", background: "#fff7ed" }}>
              <Typography sx={{ ...tajawalFont, color: "#f97316", fontWeight: 700 }}>جديدة</Typography>
              <Typography sx={{ ...tajawalFont, fontSize: 22, fontWeight: 700 }}>{countByStatus("جديدة")}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: "center", background: "#e0f2fe" }}>
              <Typography sx={{ ...tajawalFont, color: "#0284c7", fontWeight: 700 }}>جاري التنفيذ</Typography>
              <Typography sx={{ ...tajawalFont, fontSize: 22, fontWeight: 700 }}>{countByStatus("جاري التنفيذ")}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: "center", background: "#dcfce7" }}>
              <Typography sx={{ ...tajawalFont, color: "#16a34a", fontWeight: 700 }}>تم التنفيذ</Typography>
              <Typography sx={{ ...tajawalFont, fontSize: 22, fontWeight: 700 }}>{countByStatus("تم التنفيذ")}</Typography>
            </Paper>
          </Grid>
        </Grid>
        {/* نموذج إضافة تذكرة */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, color: "#f97316", ...tajawalFont, fontWeight: 700 }}>إضافة تذكرة جديدة</Typography>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <select
              name="issueType"
              value={form.issueType}
              onChange={handleChange}
              required
              style={{ padding: "0.5rem", fontSize: "1rem", borderRadius: 6, border: '1px solid #ddd', ...tajawalFont }}
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
              style={{ padding: "0.5rem", fontSize: "1rem", borderRadius: 6, border: '1px solid #ddd', minHeight: "80px", ...tajawalFont }}
            />
            <Button type="submit" variant="contained" sx={{ background: "#f97316", fontWeight: "bold", ...tajawalFont, fontSize: 17 }}>
              إرسال تذكرة
            </Button>
          </form>
        </Paper>
        {/* جدول التذاكر */}
        <Paper sx={{ p: 2, borderRadius: 3, boxShadow: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, color: "#f97316", ...tajawalFont, fontWeight: 700 }}>تذاكر الصيانة</Typography>
          <Box sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.97rem" }}>
              <thead style={{ backgroundColor: "#f2f2f2" }}>
                <tr>
                  <th style={thStyle}>نوع المشكلة</th>
                  <th style={thStyle}>الوصف</th>
                  <th style={thStyle}>الحالة</th>
                  <th style={thStyle}>تاريخ الإنشاء</th>
                  <th style={thStyle}>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} style={{ textAlign: "center", borderTop: "1px solid #eee", background: ticket.status === "جديدة" ? "#fff7ed" : ticket.status === "جاري التنفيذ" ? "#e0f2fe" : "#dcfce7" }}>
                    <td style={tdStyle}>{ticket.issueType}</td>
                    <td style={tdStyle}>{ticket.description}</td>
                    <td style={tdStyle}>
                      <Chip
                        icon={statusIcon(ticket.status)}
                        label={ticket.status}
                        color={statusColor(ticket.status)}
                        sx={{ ...tajawalFont, fontWeight: 700 }}
                      />
                    </td>
                    <td style={tdStyle}>{formatDate(ticket.createdAt)}</td>
                    <td style={tdStyle}>
                      {ticket.status === "جاري التنفيذ" && (
                        <Button onClick={() => updateStatus(ticket.id)} variant="contained" color="success" sx={{ ...tajawalFont, fontWeight: 700, mb: 0.5 }}>
                          تأكيد التنفيذ
                        </Button>
                      )}
                      {ticket.status === "تم التنفيذ" && (
                        <Button onClick={() => handleImageUpload(ticket.id)} variant="outlined" color="info" sx={{ ...tajawalFont, fontWeight: 700 }}>
                          إضافة صور
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Paper>
        {/* Snackbar */}
        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert severity={snackbar.severity} sx={{ width: '100%', ...tajawalFont }} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

const thStyle = { padding: "10px", border: "1px solid #ddd", background: "#fafafa", fontWeight: 700 };
const tdStyle = { padding: "8px", border: "1px solid #ddd" }; 