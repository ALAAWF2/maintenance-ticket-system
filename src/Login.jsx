import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const isAdmin = email === "admin@orangebedbath.com"; // ← عدّل الإيميل إذا مختلف
    localStorage.setItem("role", isAdmin ? "admin" : "outlet");

    if (isAdmin) {
      navigate("/admin");
      return;
    }

    // ✅ المعارض فقط يمرون هنا
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const outlet = docSnap.data().outlet;
      localStorage.setItem("outlet", outlet || "");
      navigate("/dashboard");
    } else {
      alert("❌ لا يوجد معرض مرتبط بهذا المستخدم");
    }
  } catch (error) {
    alert("فشل تسجيل الدخول ❌");
    console.error(error);
  }
};


  return (
    <div style={{ padding: "2rem", maxWidth: "400px", margin: "auto" }}>
      <h2 style={{ textAlign: "center", color: "#f97316" }}>تسجيل دخول المعرض</h2>
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <input
          type="email"
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" style={{ backgroundColor: "#f97316", color: "#fff", padding: "0.5rem" }}>
          تسجيل الدخول
        </button>
      </form>
    </div>
  );
}
