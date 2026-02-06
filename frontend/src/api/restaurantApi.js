import axios from 'axios';

const API_URL = 'http://localhost:5000/api/admin/restaurants';

// Get auth token
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

// Get all restaurants with filters
export const getAllRestaurants = async (params = {}) => {
    const response = await axios.get(API_URL, {
        params,
        headers: getAuthHeader()
    });
    return response.data;
};

// Get restaurant details
export const getRestaurantDetails = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`, {
        headers: getAuthHeader()
    });
    return response.data;
};

// Get restaurant statistics
export const getRestaurantStats = async (id) => {
    const response = await axios.get(`${API_URL}/${id}/stats`, {
        headers: getAuthHeader()
    });
    return response.data;
};

// Update restaurant info
export const updateRestaurantInfo = async (id, data) => {
    const response = await axios.patch(`${API_URL}/${id}`, data, {
        headers: getAuthHeader()
    });
    return response.data;
};

// Soft delete (deactivate)
export const deactivateRestaurant = async (id, reason) => {
    const response = await axios.post(`${API_URL}/${id}/deactivate`,
        { reason },
        { headers: getAuthHeader() }
    );
    return response.data;
};

// Reactivate restaurant
export const reactivateRestaurant = async (id) => {
    const response = await axios.post(`${API_URL}/${id}/reactivate`, {},
        { headers: getAuthHeader() }
    );
    return response.data;
};

// Force delete (permanent)
export const forceDeleteRestaurant = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`, {
        headers: getAuthHeader()
    });
    return response.data;
};
