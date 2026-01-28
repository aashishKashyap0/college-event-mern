import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { hodAPI } from '../utils/api';
import { Calendar, Clock, MapPin, Building2, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';

const HODDashboard = () => {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadPendingBookings();
  }, []);

  const loadPendingBookings = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await hodAPI.getPendingBookings();
      setPendingBookings(res.data.bookings || []);
    } catch (err) {
      setError('Failed to load pending bookings. Please try again.');
      console.error('Error loading bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId, status) => {
    setProcessingId(bookingId);
    setError('');
    
    try {
      await hodAPI.updateBookingStatus(bookingId, status);
      setSuccessMessage(`Booking ${status.toLowerCase()} successfully!`);
      
      // Reload bookings
      loadPendingBookings();
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${status.toLowerCase()} booking`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Layout title="HOD Dashboard">
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

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-green-500 to-blue-500 rounded-xl shadow-lg p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium opacity-90 mb-1">Pending Approvals</h3>
            <p className="text-4xl font-bold">{pendingBookings.length}</p>
          </div>
          <Building2 className="w-16 h-16 opacity-50" />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader className="w-8 h-8 text-green-600 animate-spin" />
        </div>
      )}

      {/* Pending Bookings */}
      {!loading && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-gray-800">Pending Booking Requests</h3>
          
          {pendingBookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No pending booking requests</p>
              <p className="text-sm mt-2">All auditorium bookings have been reviewed</p>
            </div>
          ) : (
            pendingBookings.map((booking) => (
              <div key={booking._id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-green-500 to-blue-500"></div>
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-gray-800 mb-1">
                        {booking.event?.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {booking.event?.description}
                      </p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium">
                      Pending
                    </span>
                  </div>

                  {/* Booking Details */}
                  <div className="grid md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Auditorium</p>
                      <div className="flex items-center text-gray-800 font-medium">
                        <Building2 className="w-4 h-4 mr-2 text-green-600" />
                        {booking.auditorium?.name}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 ml-6">
                        {booking.auditorium?.location} • Capacity: {booking.auditorium?.capacity}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Date & Time</p>
                      <div className="flex items-center text-gray-800 font-medium">
                        <Calendar className="w-4 h-4 mr-2 text-green-600" />
                        {formatDate(booking.date)}
                      </div>
                      <div className="flex items-center text-gray-600 text-sm mt-1 ml-6">
                        <Clock className="w-4 h-4 mr-2" />
                        {booking.startTime} - {booking.endTime}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Requested By</p>
                      <p className="text-gray-800 font-medium">{booking.requestedBy?.name}</p>
                      <p className="text-xs text-gray-500">{booking.requestedBy?.email}</p>
                      <p className="text-xs text-gray-500">{booking.requestedBy?.department}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Request Date</p>
                      <p className="text-gray-800 font-medium">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(booking.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleUpdateStatus(booking._id, 'APPROVED')}
                      disabled={processingId === booking._id}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {processingId === booking._id ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Approve Booking
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleUpdateStatus(booking._id, 'REJECTED')}
                      disabled={processingId === booking._id}
                      className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {processingId === booking._id ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 mr-2" />
                          Reject Booking
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Layout>
  );
};

export default HODDashboard;
