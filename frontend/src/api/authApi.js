// src/api/authApi.js
import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/auth`;

export const registerApi = (data) => {
  return axios.post(`${API_URL}/register`, data);
};

export const loginApi = (data) => {
  return axios.post(`${API_URL}/login`, data);
}

export const loginWithGoogleApi = (token) => {
  return axios.post(`${API_URL}/google`, { token });
}
