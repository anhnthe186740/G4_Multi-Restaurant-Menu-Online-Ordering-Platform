import axios from 'axios';

import { API_URL } from "./config";

const publicApi = axios.create({
    baseURL: `${API_URL}/public`,
});

export const getMenuByTable             = async (tableId) => publicApi.get(`/menu/${tableId}`);
export const createPublicOrder          = async (data)    => publicApi.post('/order', data);
export const getServerIP                = ()              => publicApi.get('/server-ip');
export const createPublicServiceRequest = (data)          => publicApi.post('/service-request', data);
export const getPublicOrderByTable      = (tableId)       => publicApi.get(`/table/${tableId}/order`);
export const cancelPublicOrderItem      = (data)          => publicApi.patch('/cancel-item', data);
