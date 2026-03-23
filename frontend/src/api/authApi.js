// src/api/authApi.js
import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";

export const registerApi = (data) => {
  return axios.post(`${API_URL}/register`, data);
};

export const loginApi = (data) => {
  return axios.post(`${API_URL}/login`, data);
}

export const loginWithGoogleApi = (token) => {
  return axios.post(`${API_URL}/google`, { token });
}

export const sendChangePasswordOtpApi = (data) => {
  return axios.post(`${API_URL}/send-change-password-otp`, data, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });
};

export const changePasswordApi = (data) => {
  return axios.post(`${API_URL}/change-password`, data, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });
};

