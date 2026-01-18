// src/api/authApi.js
import axios from "axios";

const API_URL = "http://localhost:8080/api/auth";

export const registerApi = (data) => {
  return axios.post(`${API_URL}/register`, data);
};

export const loginApi = (data) => {
  return axios.post(`${API_URL}/login`, data);
}
