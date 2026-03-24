import { API_URL as BASE_API_URL } from "./config";

const API_URL = `${BASE_API_URL}/auth`;

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

