import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Box, Button, TextField, Typography, Container, Snackbar, Alert } from "@mui/material";

// إضافة خط Google Fonts (Tajawal)
const tajawalFont = {
  fontFamily: 'Tajawal, Arial, sans-serif',
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      localStorage.setItem("userUid", user.uid);

      // Check user role
      const role = email.includes("admin") ? "admin" : "outlet";
      localStorage.setItem("role", role);

      if (role === "admin") {
        navigate("/admin");
        return;
      }

      // إذا لم يكن أدمن، جلب اسم المعرض من قاعدة البيانات
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const outletName = userDoc.data().outlet;
        localStorage.setItem("outlet", outletName);
        navigate("/dashboard");
      } else {
        setError("لا يوجد اسم معرض مرتبط بهذا المستخدم.");
        setOpenSnackbar(true);
      }
    } catch (error) {
      setError("فشل تسجيل الدخول. يرجى التحقق من البريد الإلكتروني وكلمة المرور.");
      setOpenSnackbar(true);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* تحميل خط Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet" />
      <Container component="main" maxWidth="xs" sx={{ boxShadow: 3, borderRadius: 3, background: "#fff", py: 4 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* شعار Orange Bed & Bath */}
          <img src="/logo192.png" alt="Orange Bed & Bath Logo" style={{ width: 80, marginBottom: 16 }} />
          <Typography component="h1" variant="h5" sx={{ mb: 2, color: "#f97316", ...tajawalFont }}>
            تسجيل الدخول
          </Typography>
          <Typography sx={{ color: "#888", mb: 2, ...tajawalFont, fontSize: 15 }}>
            يرجى إدخال بريدك الإلكتروني وكلمة المرور للدخول للنظام
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: "100%" }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="البريد الإلكتروني"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={tajawalFont}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="كلمة المرور"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={tajawalFont}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, background: "#f97316", fontWeight: "bold", ...tajawalFont, fontSize: 18, letterSpacing: 1 }}
            >
              تسجيل الدخول
            </Button>
          </Box>
        </Box>
        {/* Snackbar لرسائل الخطأ */}
        <Snackbar open={openSnackbar} autoHideDuration={4000} onClose={() => setOpenSnackbar(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert severity="error" sx={{ width: '100%', ...tajawalFont }} onClose={() => setOpenSnackbar(false)}>
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
} 