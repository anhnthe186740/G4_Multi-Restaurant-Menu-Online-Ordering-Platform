import axios from 'axios';

const restaurantAxios = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/admin/restaurants`,
});

// Interceptor: luôn lấy token mới nhất từ localStorage
restaurantAxios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

// Get all restaurants with filters
export const getAllRestaurants = async (params = {}) => {
    const response = await restaurantAxios.get('/', { params });
    return response.data;
};

// Get restaurant details
export const getRestaurantDetails = async (id) => {
    const response = await restaurantAxios.get(`/${id}`);
    return response.data;
};

// Get restaurant statistics
export const getRestaurantStats = async (id) => {
    const response = await restaurantAxios.get(`/${id}/stats`);
    return response.data;
};

// Soft delete (deactivate)
export const deactivateRestaurant = async (id, reason) => {
    const response = await restaurantAxios.post(`/${id}/deactivate`, { reason });
    return response.data;
};

// Reactivate restaurant
export const reactivateRestaurant = async (id) => {
    const response = await restaurantAxios.post(`/${id}/reactivate`, {});
    return response.data;
};

// Force delete (permanent)
export const forceDeleteRestaurant = async (id) => {
    const response = await restaurantAxios.delete(`/${id}`);
    return response.data;
};

// Get all service packages (for filter dropdown) — dùng public route, không cần auth
export const getServicePackages = async () => {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/service-packages/public`);
    return response.data;
};
