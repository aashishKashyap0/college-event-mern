import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { eventAPI, audiAPI } from '../utils/api';
import { Calendar, Clock, MapPin, Users, Plus, Download, QrCode, CheckCircle, AlertCircle, Loader, Building2 } from 'lucide-react';
import QRCode from 'qrcode.react';

const CoordinatorDashboard = () => {
  const [activeTab, setActiveTab] = useState('events');
  const [myEvents, setMyEvents] = useState([]);
  const [auditoriums, setAuditoriums] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Event form state
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
    department: '',
    maxParticipants: 100,
    registrationDeadline: ''
  });

  // Audi booking state
  const [showAudiForm, setShowAudiForm] = useState(false);
  const [audiForm, setAudiForm] = useState({
    eventId: '',
    auditoriumId: '',
    date: '',
    startTime: '',
    endTime: ''
  });
  const [availableAudis, setAvailableAudis] = useState([]);

  // Registrations modal
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [showRegistrations, setShowRegistrations] = useState(false);

  // QR modal
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrEventId, setQrEventId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Load coordinator's events
      const eventsRes = await eventAPI.getEvents({ mine: true });
      setMyEvents(eventsRes.data.events || []);

      // Load auditoriums
      const audisRes = await audiAPI.getAuditoriums();
      setAuditoriums(audisRes.data.auditoriums || []);

      // Load booking requests
      const bookingsRes = await audiAPI.getMyRequests();
      setMyBookings(bookingsRes.data.bookings || []);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await eventAPI.createEvent(eventForm);
      setSuccessMessage('Event created successfully!');
      setShowEventForm(false);
      
      // Reset form
      setEventForm({
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        venue: '',
        department: '',
        maxParticipants: 100,
        registrationDeadline: ''
      });
      
      // Reload events
      loadData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create event');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleCheckAvailability = async () => {
    if (!audiForm.date || !audiForm.startTime || !audiForm.endTime) {
      setError('Please select date and time');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const res = await audiAPI.checkAvailability({
        date: audiForm.date,
        startTime: audiForm.startTime,
        endTime: audiForm.endTime
      });
      setAvailableAudis(res.data.available || []);
    } catch (err) {
      setError('Failed to check availability');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleBookAuditorium = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await audiAPI.bookAuditorium(audiForm);
      setSuccessMessage('Auditorium booking request submitted!');
      setShowAudiForm(false);
      
      // Reset form
      setAudiForm({
        eventId: '',
        auditoriumId: '',
        date: '',
        startTime: '',
        endTime: ''
      });
      setAvailableAudis([]);
      
      // Reload bookings
      loadData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book auditorium');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleViewRegistrations = async (event) => {
    try {
      const res = await eventAPI.getEventRegistrations(event._id);
      setRegistrations(res.data.registrations || []);
      setSelectedEvent(event);
      setShowRegistrations(true);
    } catch (err) {
      setError('Failed to load registrations');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleExportRegistrations = async (eventId) => {
    try {
      const response = await eventAPI.exportRegistrations(eventId);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `registrations_${eventId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setSuccessMessage('Registrations exported successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to export registrations');
      setTimeout(() => setError(''), 3000);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Layout title="Coordinator Dashboard">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2 text-green-700">
          <CheckCircle className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex border-b overflow-x-auto">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-6 py-4 font-medium whitespace-nowrap ${
              activeTab === 'events'
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Manage Events ({myEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('audi')}
            className={`px-6 py-4 font-medium whitespace-nowrap ${
              activeTab === 'audi'
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Audi Booking ({myBookings.length})
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      )}

      {/* Events Tab */}
      {!loading && activeTab === 'events' && (
        <div className="space-y-6">
          {/* Create Event Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowEventForm(!showEventForm)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-medium shadow-md flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create New Event</span>
            </button>
          </div>

          {/* Event Creation Form */}
          {showEventForm && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Create New Event</h3>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Event Title *</label>
                    <input
                      type="text"
                      value={eventForm.title}
                      onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                    <input
                      type="text"
                      value={eventForm.department}
                      onChange={(e) => setEventForm({ ...eventForm, department: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                    <textarea
                      value={eventForm.description}
                      onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                      rows="3"
                      className="input-field"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Event Date *</label>
                    <input
                      type="date"
                      value={eventForm.date}
                      onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Registration Deadline *</label>
                    <input
                      type="date"
                      value={eventForm.registrationDeadline}
                      onChange={(e) => setEventForm({ ...eventForm, registrationDeadline: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                    <input
                      type="time"
                      value={eventForm.startTime}
                      onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
                    <input
                      type="time"
                      value={eventForm.endTime}
                      onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Venue *</label>
                    <input
                      type="text"
                      value={eventForm.venue}
                      onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Participants *</label>
                    <input
                      type="number"
                      value={eventForm.maxParticipants}
                      onChange={(e) => setEventForm({ ...eventForm, maxParticipants: parseInt(e.target.value) })}
                      className="input-field"
                      min="1"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex space-x-2 pt-2">
                  <button type="submit" className="btn-primary">
                    Create Event
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEventForm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* My Events List */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">My Events</h3>
            
            {myEvents.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>You haven't created any events yet</p>
              </div>
            ) : (
              myEvents.map((event) => (
                <div key={event._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1 mb-4 lg:mb-0">
                      <h4 className="text-lg font-bold text-gray-800 mb-2">{event.title}</h4>
                      <p className="text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-purple-600" />
                          {formatDate(event.date)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1 text-purple-600" />
                          {event.startTime} - {event.endTime}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1 text-purple-600" />
                          {event.venue}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1 text-purple-600" />
                          {event.registrationCount || 0} registered
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleViewRegistrations(event)}
                        className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition font-medium text-sm"
                      >
                        View Registrations
                      </button>
                      <button
                        onClick={() => handleExportRegistrations(event._id)}
                        className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition font-medium text-sm flex items-center space-x-1"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export CSV</span>
                      </button>
                      <button
                        onClick={() => {
                          setQrEventId(event._id);
                          setShowQRModal(true);
                        }}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium text-sm flex items-center space-x-1"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>QR Code</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
  {/* Audi Booking Tab */}
      {!loading && activeTab === 'audi' && (
        <div className="space-y-6">
          {/* Book Auditorium Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowAudiForm(!showAudiForm)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-medium shadow-md flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Request Booking</span>
            </button>
          </div>

          {/* Auditorium Booking Form */}
          {showAudiForm && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Book Auditorium</h3>
              <form onSubmit={handleBookAuditorium} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Event *</label>
                    <select
                      value={audiForm.eventId}
                      onChange={(e) => setAudiForm({ ...audiForm, eventId: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="">Choose an event</option>
                      {myEvents.map(event => (
                        <option key={event._id} value={event._id}>{event.title}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      value={audiForm.date}
                      onChange={(e) => setAudiForm({ ...audiForm, date: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                    <input
                      type="time"
                      value={audiForm.startTime}
                      onChange={(e) => setAudiForm({ ...audiForm, startTime: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
                    <input
                      type="time"
                      value={audiForm.endTime}
                      onChange={(e) => setAudiForm({ ...audiForm, endTime: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                {/* Check Availability Button */}
                <button
                  type="button"
                  onClick={handleCheckAvailability}
                  className="bg-blue-100 text-blue-700 px-6 py-2 rounded-lg hover:bg-blue-200 transition font-medium"
                >
                  Check Availability
                </button>

                {/* Available Auditoriums */}
                {availableAudis.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Auditoriums ({availableAudis.length})
                    </label>
                    <select
                      value={audiForm.auditoriumId}
                      onChange={(e) => setAudiForm({ ...audiForm, auditoriumId: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="">Select an auditorium</option>
                      {availableAudis.map(audi => (
                        <option key={audi._id} value={audi._id}>
                          {audi.name} (Capacity: {audi.capacity}) - {audi.location}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex space-x-2 pt-2">
                  <button
                    type="submit"
                    disabled={!audiForm.auditoriumId}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Request
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAudiForm(false);
                      setAvailableAudis([]);
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* My Booking Requests */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">My Booking Requests</h3>
            
            {myBookings.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>You haven't made any booking requests yet</p>
              </div>
            ) : (
              myBookings.map((booking) => (
                <div key={booking._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1 mb-4 lg:mb-0">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-lg font-bold text-gray-800">{booking.event?.title}</h4>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Building2 className="w-4 h-4 mr-1 text-purple-600" />
                          {booking.auditorium?.name}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1 text-purple-600" />
                          {booking.auditorium?.location}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-purple-600" />
                          {formatDate(booking.date)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1 text-purple-600" />
                          {booking.startTime} - {booking.endTime}
                        </div>
                      </div>
                      
                      {booking.approvedBy && (
                        <p className="text-xs text-gray-500 mt-2">
                          {booking.status === 'APPROVED' ? 'Approved' : 'Rejected'} by: {booking.approvedBy.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Registrations Modal */}
      {showRegistrations && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">
                Registrations - {selectedEvent.title}
              </h3>
              <button
                onClick={() => setShowRegistrations(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {registrations.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No registrations yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {registrations.map((reg) => (
                        <tr key={reg._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-800">{reg.student?.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{reg.student?.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{reg.student?.department || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(reg.registeredAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {reg.checkedIn ? (
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                                Checked In
                              </span>
                            ) : (
                              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-medium">
                                Registered
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && qrEventId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Event Check-in QR Code</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg border-4 border-purple-600 mb-4">
                <QRCode
                  value={`${window.location.origin}/checkin/${qrEventId}`}
                  size={256}
                  level="H"
                />
              </div>
              <p className="text-sm text-gray-600 text-center mb-4">
                Students can scan this QR code to check-in to the event
              </p>
              <p className="text-xs text-gray-500 text-center break-all">
                {`${window.location.origin}/checkin/${qrEventId}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CoordinatorDashboard;