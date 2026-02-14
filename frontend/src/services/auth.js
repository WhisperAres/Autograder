import axios from "axios";

const API_URL = import.meta.env.PROD ? "https://your-app-name.onrender.com/api" : "http://localhost:5000/api";

const api = axios.create({
    baseURL: API_URL
});

// Request Interceptor: Attach token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response Interceptor: Automatically handles expired tokens
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // If the error is 401 (Unauthorized/Expired) and we haven't tried refreshing yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem("refreshToken");

            if (refreshToken) {
                try {
                    // Call the refresh endpoint
                    const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
                    const newToken = res.data.token;
                    
                    // Store new token
                    localStorage.setItem("token", newToken);
                    
                    // Update header and retry the original request
                    originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    // If refresh fails, log out the user
                    logout();
                }
            }
        }
        return Promise.reject(error);
    }
);

export const login = async (email, password) => {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password });
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("refreshToken", res.data.refreshToken); // Store refresh token
    localStorage.setItem("user", JSON.stringify(res.data.user));
    return res.data;
};

export const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    window.location.href = "/login";
};

export const getToken = () => localStorage.getItem("token");

export const getUser = () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
};

export default api;