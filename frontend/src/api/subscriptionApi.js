import axios from "axios";

const API_URL = "http://localhost:5000/api";

const subscriptionAxios = axios.create({
  baseURL: `${API_URL}/restaurant/subscription`,
});

subscriptionAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export const getPublicPackages = () => subscriptionAxios.get("/packages");
export const getMySubscription = () => subscriptionAxios.get("/my-subscription");
export const createPaymentLink = (packageId) => subscriptionAxios.post("/create-payment", { packageId });
export const checkPaymentStatus = (orderCode) => subscriptionAxios.get(`/check-payment/${orderCode}`);

export default subscriptionAxios;
