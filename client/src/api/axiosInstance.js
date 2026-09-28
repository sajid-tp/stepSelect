import axios from 'axios';

// withCredentials makes the browser send/receive the httpOnly auth cookie
// automatically on every request — no manual header handling needed.
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Central place to normalize error messages so components don't each
// need their own try/catch parsing of err.response.data.message.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';
    return Promise.reject({ ...error, message });
  }
);

export default axiosInstance;
