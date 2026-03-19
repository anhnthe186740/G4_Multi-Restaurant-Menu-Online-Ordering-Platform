import axios from 'axios';

// Create an API instance with the base URL for public endpoints
const publicApi = axios.create({
    baseURL: `http://${window.location.hostname}:5000/api/public`,
});

/**
 * Fetch menu data based on tableId
 * @param {number|string} tableId 
 * @returns {Promise<Object>} Contains restaurant, branch, table, and categories (with products)
 */
export const getMenuByTable = async (tableId) => {
    return await publicApi.get(`/menu/${tableId}`);
};

export const getServerIP = () => publicApi.get('/server-ip');
