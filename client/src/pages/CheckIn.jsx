import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventAPI } from '../utils/api';
import { CheckCircle, XCircle, Loader, Calendar, ArrowLeft } from 'lucide-react';

const CheckIn = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success', 'error', or null
  const [message, setMessage] = useState('');
  const [event, setEvent] = useState(null);

  useEffect(() => {
    loadEventAndCheckIn();
  }, [eventId]);

  const loadEventAndCheckIn = async () => {
    setLoading(true);
    
    try {
      // First, get event details
      const eventRes = await eventAPI.getEvent(eventId);
      setEvent(eventRes.data.event);

      // Attempt check-in
      const checkInRes = await eventAPI.checkIn(eventId);
      
      if (checkInRes.data.success) {
        setStatus('success');
        setMessage('You have been successfully checked in to this event!');
      }
    } catch (err) {
      setStatus('error');
      const errorMessage = err.response?.data?.message || 'Failed to check in. Please try again.';
      setMessage(errorMessage);
      console.error('Check-in error:', err);
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {loading ? (
          <div className="bg-white rounded-2xl shadow-2xl p-12">
            <div className="flex flex-col items-center">
              <Loader className="w-16 h-16 text-blue-600 animate-spin mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Processing Check-in</h2>
              <p className="text-gray-600 text-center">Please wait while we verify your registration...</p>
            </div>
          </div>
        ) : status === 'success' ? (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Check-in Successful!</h2>
              <p className="text-gray-600 text-center mb-6">{message}</p>

              {event && (
                <div className="w-full bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
                  <h3 className="font-bold text-gray-800 mb-2">{event.title}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                      {formatDate(event.date)}
                    </div>
                    <p className="ml-6">{event.venue}</p>
                    <p className="ml-6">{event.startTime} - {event.endTime}</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => navigate('/student')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-medium shadow-md hover:shadow-lg flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : status === 'error' ? (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Check-in Failed</h2>
              <p className="text-gray-600 text-center mb-6">{message}</p>

              {event && (
                <div className="w-full bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-bold text-gray-800 mb-2">{event.title}</h3>
                  <p className="text-sm text-gray-600">{formatDate(event.date)} • {event.venue}</p>
                </div>
              )}

              <div className="w-full space-y-2">
                <button
                  onClick={() => navigate('/student')}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-medium shadow-md hover:shadow-lg flex items-center justify-center"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Dashboard
                </button>
                
                <button
                  onClick={loadEventAndCheckIn}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CheckIn;