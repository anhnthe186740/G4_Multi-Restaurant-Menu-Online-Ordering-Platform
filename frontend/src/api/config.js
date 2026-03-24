const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`;

export const API_URL = `${API_BASE_URL}/api`;
export const SOCKET_URL = API_BASE_URL;
export const UPLOADS_URL = `${API_BASE_URL}/uploads`;
