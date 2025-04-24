import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export default function SubmitTicket() {
  const [form, setForm] = useState({
    issueType: "",
    description: "",
    image: null,
  });

  const navigate = useNavigate();
  const outlet = localStorage.getItem("outlet");

  useEffect(() => {
    if (!outlet) {
      navigate("/"); // يرجع المستخدم إلى صفحة تسجيل الدخول إذا لم يكن مسجلاً
    }
  }, [navigate, outlet]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "tickets"), {
        outlet: outlet,
        issueType: form.issueType,
        description: form.description,
        status: "جديدة",
        createdAt: serverTimestamp(),
      });
      alert("✅ تم إرسال التذكرة");
      setForm({ issueType: "", description: "", image: null });
    } catch (error) {
      console.error("Error:", error);
      alert("❌ فشل في الإرسال");
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "auto" }}>
      <h2 style={{ textAlign: "center", color: "#f97316" }}>
        Orange Bed & Bath - طلب صيانة
      </h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <input
          name="issueType"
          placeholder="نوع المشكلة"
          value={form.issueType}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="وصف المشكلة"
          value={form.description}
          onChange={handleChange}
          required
        />
        <input
          name="image"
          type="file"
          accept="image/*"
          onChange={handleChange}
        />
        <button type="submit" style={{ backgroundColor: "#f97316", color: "#fff", padding: "0.5rem" }}>
          إرسال التذكرة
        </button>
      </form>
    </div>
  );
}
