import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  deleteDoc,
  query as firestoreQuery,
  where,
} from "firebase/firestore";
import { db } from "../services/firebase";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Navigate, useNavigate } from "react-router-dom";
import { Box, Typography, Button, Snackbar, Alert, Paper, Grid, Chip, AppBar, Toolbar, Container, MenuItem, Select, InputLabel, FormControl } from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';

const tajawalFont = {
  fontFamily: 'Tajawal, Arial, sans-serif',
};

export default function AdminDashboard() {
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [outletFilter, setOutletFilter] = useState("all");
  const [sortDirection, setSortDirection] = useState("desc");
  const [redirect, setRedirect] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
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
    try {
      const updates = { status: newStatus };
      if (newStatus === "جاري التنفيذ") {
        updates.startedAt = serverTimestamp();
      } else if (newStatus === "تم التنفيذ") {
        updates.adminConfirmedAt = serverTimestamp();
      }
      await updateDoc(doc(db, "tickets", id), updates);
      setSnackbar({ open: true, message: 'تم تحديث حالة التذكرة', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'حدث خطأ أثناء تحديث الحالة', severity: 'error' });
    }
  };

  const deleteTicket = async (id) => {
    const confirm = window.confirm("هل أنت متأكد أنك تريد حذف هذه التذكرة؟ ❌");
    if (!confirm) return;
    try {
      await deleteDoc(doc(db, "tickets", id));
      setSnackbar({ open: true, message: 'تم حذف التذكرة', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'حدث خطأ أثناء الحذف', severity: 'error' });
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

  const countByStatus = (status) => tickets.filter((t) => t.status === status).length;

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
    setSnackbar({ open: true, message: 'تم تصدير التذاكر إلى Excel', severity: 'success' });
  };

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
            Orange Bed & Bath - لوحة تحكم الأدمن
          </Typography>
          <Button color="inherit" onClick={handleLogout} sx={{ fontWeight: "bold", ...tajawalFont }}>
            تسجيل الخروج
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg">
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
        {/* فلاتر */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: 1, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <FormControl sx={{ minWidth: 150, ...tajawalFont }} size="small">
            <InputLabel>الحالة</InputLabel>
            <Select value={statusFilter} label="الحالة" onChange={e => setStatusFilter(e.target.value)} sx={tajawalFont}>
              <MenuItem value="all">كل الحالات</MenuItem>
              <MenuItem value="جديدة">جديدة</MenuItem>
              <MenuItem value="جاري التنفيذ">جاري التنفيذ</MenuItem>
              <MenuItem value="تم التنفيذ">تم التنفيذ</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 200, ...tajawalFont }} size="small">
            <InputLabel>المعرض</InputLabel>
            <Select value={outletFilter} label="المعرض" onChange={e => setOutletFilter(e.target.value)} sx={tajawalFont}>
              <MenuItem value="all">كل المعارض</MenuItem>
              {uniqueOutlets.map((outlet) => (
                <MenuItem key={outlet} value={outlet}>{outlet}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button onClick={exportToExcel} variant="contained" startIcon={<DownloadIcon />} sx={{ background: "#f59e0b", fontWeight: "bold", ...tajawalFont }}>
            تصدير Excel
          </Button>
          <Button
            onClick={() => setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))}
            variant="outlined"
            sx={{ color: "#3b82f6", borderColor: "#3b82f6", fontWeight: "bold", ...tajawalFont }}
          >
            ترتيب حسب التاريخ ({sortDirection === "asc" ? "تصاعدي" : "تنازلي"})
          </Button>
        </Paper>
        {/* جدول التذاكر */}
        <Paper sx={{ p: 2, borderRadius: 3, boxShadow: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, color: "#f97316", ...tajawalFont, fontWeight: 700 }}>جميع التذاكر</Typography>
          <Box sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.97rem" }}>
              <thead style={{ backgroundColor: "#f2f2f2" }}>
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
                  <tr key={ticket.id} style={{ textAlign: "center", borderTop: "1px solid #eee", background: ticket.status === "جديدة" ? "#fff7ed" : ticket.status === "جاري التنفيذ" ? "#e0f2fe" : "#dcfce7" }}>
                    <td style={tdStyle}>{ticket.outlet}</td>
                    <td style={tdStyle}>{ticket.issueType}</td>
                    <td style={tdStyle}>{ticket.description}</td>
                    <td style={tdStyle}>
                      <FormControl size="small" sx={{ minWidth: 120, ...tajawalFont }}>
                        <Select
                          value={ticket.status}
                          onChange={e => updateStatus(ticket.id, e.target.value)}
                          sx={tajawalFont}
                        >
                          <MenuItem value="جديدة">جديدة</MenuItem>
                          <MenuItem value="جاري التنفيذ">جاري التنفيذ</MenuItem>
                          <MenuItem value="تم التنفيذ">تم التنفيذ</MenuItem>
                        </Select>
                      </FormControl>
                    </td>
                    <td style={tdStyle}>{formatDate(ticket.createdAt)}</td>
                    <td style={tdStyle}>{formatDate(ticket.startedAt)}</td>
                    <td style={tdStyle}>{formatDate(ticket.outletConfirmedAt)}</td>
                    <td style={tdStyle}>
                      <Button
                        onClick={() => deleteTicket(ticket.id)}
                        variant="contained"
                        color="error"
                        startIcon={<DeleteIcon />}
                        sx={{ ...tajawalFont, fontWeight: 700 }}
                      >
                        حذف
                      </Button>
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