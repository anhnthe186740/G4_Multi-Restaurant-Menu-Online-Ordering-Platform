import { useState } from "react";
import { registerApi } from "../api/authApi";

function Register() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    role: "Customer"
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerApi(form);
      alert("Đăng ký thành công");
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi đăng ký");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Đăng ký</h2>

      <input name="fullName" placeholder="Họ tên" onChange={handleChange} />
      <input name="email" type="email" placeholder="Email" onChange={handleChange} />
      <input name="password" type="password" placeholder="Mật khẩu" onChange={handleChange} />
      <input name="phone" placeholder="SĐT" onChange={handleChange} />

      <select name="role" onChange={handleChange}>
        <option value="Customer">Customer</option>
        <option value="Owner">Owner</option>
      </select>

      <button type="submit">Đăng ký</button>
    </form>
  );
}

export default Register;
