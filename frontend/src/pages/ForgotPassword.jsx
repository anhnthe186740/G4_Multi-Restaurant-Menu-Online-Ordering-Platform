import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, { email });
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f0f2f5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      <div style={{
        backgroundColor: "#fff",
        borderRadius: "16px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        padding: "48px 40px",
        width: "100%",
        maxWidth: "400px",
        textAlign: "center",
      }}>
        {/* Lock Icon */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "64px",
          height: "64px",
          backgroundColor: "#3b82f6",
          borderRadius: "16px",
          marginBottom: "20px",
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="11" width="14" height="10" rx="2" fill="white"/>
            <path d="M8 11V7a4 4 0 018 0v4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="16" r="1.5" fill="#3b82f6"/>
          </svg>
        </div>

        <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#111827", margin: "0 0 8px" }}>
          Quên mật khẩu
        </h2>
        <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 28px" }}>
          Nhập email của bạn để nhận link đặt lại mật khẩu
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px", textAlign: "left" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
              Email
            </label>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
                color: "#9ca3af", display: "flex", alignItems: "center",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M2 8l10 7 10-7"/>
                </svg>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn"
                required
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 38px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  color: "#111827",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "#3b82f6"}
                onBlur={e => e.target.style.borderColor = "#d1d5db"}
              />
            </div>
          </div>

          {message && (
            <div style={{ marginBottom: "12px", padding: "10px 12px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", color: "#16a34a", fontSize: "13px" }}>
              {message}
            </div>
          )}
          {error && (
            <div style={{ marginBottom: "12px", padding: "10px 12px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "13px" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: loading ? "#93c5fd" : "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background-color 0.2s",
              marginBottom: "20px",
            }}
            onMouseEnter={e => { if (!loading) e.target.style.backgroundColor = "#2563eb"; }}
            onMouseLeave={e => { if (!loading) e.target.style.backgroundColor = "#3b82f6"; }}
          >
            {loading ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
          </button>
        </form>

        <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#3b82f6", fontSize: "14px", textDecoration: "none" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M5 12l7 7M5 12l7-7"/>
          </svg>
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
