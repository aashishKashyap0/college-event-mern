import api from '../utils/api';

// Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ===== API MODULES =====

export const eventAPI = {
  getEvents: (params = {}) => api.get("/events", { params }),
  getEvent: (id) => api.get(`/events/${id}`),
  createEvent: (data) => api.post("/events", data),
  registerForEvent: (id) => api.post(`/events/${id}/register`),
  getMyRegistrations: () => api.get("/events/registrations/me"),
  getEventRegistrations: (id) => api.get(`/events/${id}/registrations`),
  exportRegistrations: (id) =>
    api.get(`/events/${id}/registrations/export`, { responseType: "blob" }),
  checkIn: (id) => api.post(`/events/${id}/checkin`),
  submitFeedback: (id, data) => api.post(`/events/${id}/feedback`, data),
  getEventFeedback: (id) => api.get(`/events/${id}/feedback`),
};

export const audiAPI = {
  getAuditoriums: () => api.get("/audi"),
  checkAvailability: (params) =>
    api.get("/audi/availability", { params }),
  bookAuditorium: (data) => api.post("/audi/book", data),
  getMyRequests: () => api.get("/audi/my-requests"),
};

export const hodAPI = {
  getPendingBookings: () => api.get("/hod/bookings/pending"),
  getAllBookings: (params = {}) =>
    api.get("/hod/bookings", { params }),
  updateBookingStatus: (id, status) =>
    api.patch(`/hod/bookings/${id}`, { status }),
};

// ✅ ONLY ONE default export
export default api;
