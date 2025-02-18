import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.mode === "development" ? "http://localhost:6500/api" : "/api",
    withCredentials: true, // Send cookies when making cross-origin requests

})

export default axiosInstance;