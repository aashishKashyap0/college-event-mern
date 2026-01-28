import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { eventAPI } from '../utils/api';
import { Calendar, Clock, MapPin, Users, CheckCircle, Star, Loader, AlertCircle } from 'lucide-react';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Feedback state
  const [feedbackEventId, setFeedbackEventId] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Load upcoming events
      const eventsRes = await eventAPI.getEvents();
      setUpcomingEvents(eventsRes.data.events || []);

      // Load my registrations
      const regsRes = await eventAPI.getMyRegistrations();
      setMyRegistrations(regsRes.data.registrations || []);
    } catch (err) {
      setError('Failed to load events. Please try again.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId) => {
    try {
      setSuccessMessage('');
      setError('');
      
      await eventAPI.registerForEvent(eventId);
      setSuccessMessage('Successfully registered for the event!');
      
      // Reload data
      loadData();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleSubmitFeedback = async (eventId) => {
    if (rating === 0) {
      setError('Please select a rating');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setError('');
      await eventAPI.submitFeedback(eventId, { rating, comment });
      setSuccessMessage('Feedback submitted successfully!');
      
      // Reset feedback form
      setFeedbackEventId(null);
      setRating(0);
      setComment('');
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
      setTimeout(() => setError(''), 5000);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isPastEvent = (eventDate) => {
    return new Date(eventDate) < new Date();
  };

  const isRegistered = (eventId) => {
    return myRegistrations.some(reg => reg.event._id === eventId);
  };

  // Get past events for feedback
  const pastEvents = myRegistrations.filter(reg => isPastEvent(reg.event.date));

  return (
    <Layout title="Student Dashboard">
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
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-4 font-medium whitespace-nowrap ${
              activeTab === 'upcoming'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Upcoming Events
          </button>
          <button
            onClick={() => setActiveTab('registered')}
            className={`px-6 py-4 font-medium whitespace-nowrap ${
              activeTab === 'registered'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Participation ({myRegistrations.length})
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-6 py-4 font-medium whitespace-nowrap ${
              activeTab === 'feedback'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Feedback ({pastEvents.length})
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      )}

      {/* Upcoming Events Tab */}
      {!loading && activeTab === 'upcoming' && (
        <div className="grid md:grid-cols-2 gap-6">
          {upcomingEvents.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No upcoming events available</p>
            </div>
          ) : (
            upcomingEvents.map((event) => (
              <div key={event._id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{event.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
                      <span>{event.startTime} - {event.endTime}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
                      <span>{event.venue}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
                      <span>{event.registrationCount || 0} / {event.maxParticipants} registered</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                      {event.department}
                    </span>
                    
                    {isRegistered(event._id) ? (
                      <button
                        disabled
                        className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Registered</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRegister(event._id)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-medium"
                      >
                        Register Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* My Participation Tab */}
      {!loading && activeTab === 'registered' && (
        <div className="space-y-4">
          {myRegistrations.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>You haven't registered for any events yet</p>
            </div>
          ) : (
            myRegistrations.map((reg) => (
              <div key={reg._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{reg.event.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-blue-600" />
                        {formatDate(reg.event.date)}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1 text-blue-600" />
                        {reg.event.venue}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-blue-600" />
                        Registered: {new Date(reg.registeredAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0 flex items-center space-x-2">
                    {reg.checkedIn ? (
                      <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Checked In</span>
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg font-medium">
                        Not Checked In
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Feedback Tab */}
      {!loading && activeTab === 'feedback' && (
        <div className="space-y-6">
          {pastEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
              <Star className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No past events to provide feedback for</p>
            </div>
          ) : (
            pastEvents.map((reg) => (
              <div key={reg._id} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">{reg.event.title}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {formatDate(reg.event.date)} • {reg.event.venue}
                </p>

                {feedbackEventId === reg.event._id ? (
                  <div className="space-y-4">
                    {/* Star Rating */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Rating
                      </label>
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`w-8 h-8 ${
                                star <= rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comment */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Comment (Optional)
                      </label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Share your experience..."
                      />
                    </div>

                    {/* Buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSubmitFeedback(reg.event._id)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-medium"
                      >
                        Submit Feedback
                      </button>
                      <button
                        onClick={() => {
                          setFeedbackEventId(null);
                          setRating(0);
                          setComment('');
                        }}
                        className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setFeedbackEventId(reg.event._id)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-medium"
                  >
                    Give Feedback
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </Layout>
  );
};

export default StudentDashboard;