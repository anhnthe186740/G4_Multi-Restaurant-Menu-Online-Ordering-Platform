import React, { useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate, Link } from "react-router-dom";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
        token,
        newPassword,
      });
      setMessage(response.data.message);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const pageStyle = {
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  };

  const cardStyle = {
    backgroundColor: "#fff",
    borderRadius: "16px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    padding: "48px 40px",
    width: "100%",
    maxWidth: "400px",
    textAlign: "center",
  };

  const LockIcon = () => (
    <div style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: "64px", height: "64px", backgroundColor: "#3b82f6",
      borderRadius: "16px", marginBottom: "20px",
    }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="11" width="14" height="10" rx="2" fill="white"/>
        <path d="M8 11V7a4 4 0 018 0v4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="12" cy="16" r="1.5" fill="#3b82f6"/>
      </svg>
    </div>
  );

  const inputWrapper = { position: "relative", marginBottom: "16px", textAlign: "left" };
  const labelStyle = { display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "6px" };
  const inputStyle = {
    width: "100%", padding: "10px 38px 10px 12px",
    border: "1px solid #d1d5db", borderRadius: "8px",
    fontSize: "14px", color: "#111827", outline: "none",
    boxSizing: "border-box", transition: "border-color 0.2s",
  };

  const EyeIcon = ({ show, onClick }) => (
    <button type="button" onClick={onClick} style={{
      position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
      background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0,
    }}>
      {show ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      )}
    </button>
  );

  if (!token) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <LockIcon />
          <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#dc2626", margin: "0 0 8px" }}>Lỗi</h2>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 24px" }}>Token không hợp lệ hoặc đã thiếu.</p>
          <Link to="/forgot-password" style={{ color: "#3b82f6", fontSize: "14px" }}>← Yêu cầu lại</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <LockIcon />
        <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#111827", margin: "0 0 8px" }}>
          Đặt lại mật khẩu
        </h2>
        <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 28px" }}>
          Nhập mật khẩu mới cho tài khoản của bạn
        </p>

        <form onSubmit={handleSubmit}>
          {/* New Password */}
          <div style={inputWrapper}>
            <label style={labelStyle}>Mật khẩu mới</label>
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới"
              required
              minLength={6}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = "#3b82f6"}
              onBlur={e => e.target.style.borderColor = "#d1d5db"}
            />
            <EyeIcon show={showNew} onClick={() => setShowNew(!showNew)} />
          </div>

          {/* Confirm Password */}
          <div style={{ ...inputWrapper, marginBottom: "20px" }}>
            <label style={labelStyle}>Xác nhận mật khẩu mới</label>
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              required
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = "#3b82f6"}
              onBlur={e => e.target.style.borderColor = "#d1d5db"}
            />
            <EyeIcon show={showConfirm} onClick={() => setShowConfirm(!showConfirm)} />
          </div>

          {message && (
            <div style={{ marginBottom: "12px", padding: "10px 12px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", color: "#16a34a", fontSize: "13px" }}>
              {message} (Chuyển hướng sau 3s...)
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
              width: "100%", padding: "12px",
              backgroundColor: loading ? "#93c5fd" : "#3b82f6",
              color: "#fff", border: "none", borderRadius: "8px",
              fontSize: "15px", fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background-color 0.2s", marginBottom: "20px",
            }}
            onMouseEnter={e => { if (!loading) e.target.style.backgroundColor = "#2563eb"; }}
            onMouseLeave={e => { if (!loading) e.target.style.backgroundColor = "#3b82f6"; }}
          >
            {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
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

export default ResetPassword;
