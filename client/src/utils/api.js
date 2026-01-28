import axios from 'axios';

const API_BASE_URL = '/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API functions
export const eventAPI = {
  // Get all events
  getEvents: (params = {}) => api.get('/events', { params }),
  
  // Get single event
  getEvent: (id) => api.get(`/events/${id}`),
  
  // Create event (Coordinator)
  createEvent: (data) => api.post('/events', data),
  
  // Register for event (Student)
  registerForEvent: (id) => api.post(`/events/${id}/register`),
  
  // Get student's registrations
  getMyRegistrations: () => api.get('/events/registrations/me'),
  
  // Get event registrations (Coordinator)
  getEventRegistrations: (id) => api.get(`/events/${id}/registrations`),
  
  // Export registrations as CSV
  exportRegistrations: (id) => api.get(`/events/${id}/registrations/export`, { responseType: 'blob' }),
  
  // Check-in to event
  checkIn: (id) => api.post(`/events/${id}/checkin`),
  
  // Submit feedback
  submitFeedback: (id, data) => api.post(`/events/${id}/feedback`, data),
  
  // Get event feedback (Coordinator)
  getEventFeedback: (id) => api.get(`/events/${id}/feedback`)
};

export const audiAPI = {
  // Get all auditoriums
  getAuditoriums: () => api.get('/audi'),
  
  // Check availability
  checkAvailability: (params) => api.get('/audi/availability', { params }),
  
  // Book auditorium
  bookAuditorium: (data) => api.post('/audi/book', data),
  
  // Get my booking requests
  getMyRequests: () => api.get('/audi/my-requests')
};

export const hodAPI = {
  // Get pending bookings
  getPendingBookings: () => api.get('/hod/bookings/pending'),
  
  // Get all bookings
  getAllBookings: (params = {}) => api.get('/hod/bookings', { params }),
  
  // Update booking status
  updateBookingStatus: (id, status) => api.patch(`/hod/bookings/${id}`, { status })
};

export default api;