import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Video,
  Calendar,
  Clock,
  Users,
  Play,
  ChevronLeft,
  User,
  Bell,
  CheckCircle,
  Radio,
  PlayCircle,
  Download,
  MessageCircle,
  Send,
  ThumbsUp,
  ExternalLink,
  Share2,
  FileText,
  Globe,
  Loader2
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const CATEGORIES = {
  trading_basics: 'Trading Basics',
  technical_analysis: 'Technical Analysis',
  fundamental_analysis: 'Fundamental Analysis',
  risk_management: 'Risk Management',
  psychology: 'Trading Psychology',
  platform_tutorial: 'Platform Tutorial',
  market_analysis: 'Market Analysis',
  qa_session: 'Q&A Session',
  special_event: 'Special Event'
};

const WebinarDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [webinar, setWebinar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [showRecording, setShowRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState(null);
  const [question, setQuestion] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);

  useEffect(() => {
    loadWebinar();
  }, [slug]);

  const loadWebinar = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/webinars/${slug}`);
      setWebinar(response.data.webinar);
    } catch (error) {
      console.error('Failed to load webinar:', error);
      if (error.response?.status === 404) {
        navigate('/webinars');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/webinars/' + slug);
      return;
    }

    setRegistering(true);
    try {
      await api.post(`/api/webinars/${slug}/register`);
      toast.success('Successfully registered for webinar!');
      loadWebinar();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to register');
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregister = async () => {
    if (!confirm('Are you sure you want to cancel your registration?')) return;

    try {
      await api.post(`/api/webinars/${slug}/unregister`);
      toast.success('Registration cancelled');
      loadWebinar();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to unregister');
    }
  };

  const handleWatchRecording = async () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/webinars/' + slug);
      return;
    }

    try {
      const response = await api.get(`/api/webinars/${slug}/recording`);
      setRecordingUrl(response.data.recording_url);
      setShowRecording(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load recording');
    }
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    if (!isAuthenticated) {
      navigate('/login?redirect=/webinars/' + slug);
      return;
    }

    setSubmittingQuestion(true);
    try {
      await api.post(`/api/webinars/${slug}/questions`, { question });
      toast.success('Question submitted!');
      setQuestion('');
      loadWebinar();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit question');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getCountdown = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date - now;

    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/4"></div>
            <div className="h-96 bg-gray-700 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!webinar) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl text-white mb-4">Webinar not found</h2>
          <Link to="/webinars" className="text-purple-400 hover:text-purple-300">
            Back to Webinars
          </Link>
        </div>
      </div>
    );
  }

  const isLive = webinar.status === 'live';
  const isPast = webinar.is_past;
  const countdown = getCountdown(webinar.scheduled_at);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Back Navigation */}
      <div className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link
            to="/webinars"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            Back to Webinars
          </Link>
        </div>
      </div>

      {/* Live Banner */}
      {isLive && (
        <div className="bg-red-600 py-3">
          <div className="max-w-6xl mx-auto px-4 flex items-center justify-center gap-3">
            <Radio className="h-5 w-5 text-white animate-pulse" />
            <span className="font-bold text-white">LIVE NOW</span>
            {webinar.join_url && webinar.is_registered && (
              <a
                href={webinar.join_url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-4 px-4 py-1 bg-white text-red-600 rounded-full font-medium hover:bg-gray-100"
              >
                Join Now
              </a>
            )}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Video/Thumbnail Area */}
            <div className="relative rounded-xl overflow-hidden mb-6">
              {showRecording && recordingUrl ? (
                <div className="aspect-video bg-black">
                  <iframe
                    src={recordingUrl}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              ) : webinar.banner_image || webinar.thumbnail ? (
                <img
                  src={webinar.banner_image || webinar.thumbnail}
                  alt={webinar.title}
                  className="w-full aspect-video object-cover"
                />
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
                  <Video className="h-20 w-20 text-white/30" />
                </div>
              )}

              {/* Recording Watch Button */}
              {webinar.has_recording && !showRecording && isPast && (
                <button
                  onClick={handleWatchRecording}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/60 transition-colors"
                >
                  <div className="flex flex-col items-center gap-2">
                    <PlayCircle className="h-16 w-16 text-white" />
                    <span className="text-white font-medium">Watch Recording</span>
                  </div>
                </button>
              )}

              {/* Status Badge */}
              {isLive && (
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-red-600 rounded-full text-white font-medium animate-pulse">
                  <Radio className="h-4 w-4" />
                  LIVE
                </div>
              )}
            </div>

            {/* Title & Meta */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-sm">
                  {CATEGORIES[webinar.category] || webinar.category}
                </span>
                {webinar.is_free ? (
                  <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm">
                    Free
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 rounded-full text-sm">
                    ${webinar.price}
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold text-white mb-4">{webinar.title}</h1>

              <div className="flex flex-wrap items-center gap-4 text-gray-400">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {formatDate(webinar.scheduled_at)}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {formatTime(webinar.scheduled_at)} ({webinar.duration_minutes} min)
                </span>
                <span className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  {webinar.timezone}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">About This Webinar</h2>
              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: webinar.description || webinar.short_description }}
              />
            </div>

            {/* Resources */}
            {webinar.resources?.length > 0 && (
              <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-400" />
                  Resources
                </h2>
                <div className="space-y-3">
                  {webinar.resources.map(resource => (
                    <a
                      key={resource.id}
                      href={resource.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Download className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="text-white font-medium">{resource.title}</div>
                          {resource.description && (
                            <div className="text-gray-500 text-sm">{resource.description}</div>
                          )}
                        </div>
                      </div>
                      <span className="text-gray-500 text-sm uppercase">{resource.file_type}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Q&A Section */}
            {webinar.allow_questions && (
              <div className="bg-gray-800/50 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-purple-400" />
                  Questions & Answers
                </h2>

                {/* Submit Question */}
                <form onSubmit={handleSubmitQuestion} className="mb-6">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Ask a question..."
                      className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      maxLength={1000}
                    />
                    <button
                      type="submit"
                      disabled={!question.trim() || submittingQuestion}
                      className="px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 rounded-lg text-white"
                    >
                      {submittingQuestion ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </form>

                {/* Questions List */}
                {webinar.featured_questions?.length > 0 ? (
                  <div className="space-y-4">
                    {webinar.featured_questions.map(q => (
                      <div key={q.id} className="p-4 bg-gray-700/50 rounded-lg">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{q.user?.username}</span>
                              {q.is_featured && (
                                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                                  Featured
                                </span>
                              )}
                            </div>
                            <p className="text-gray-300 mt-1">{q.question}</p>
                          </div>
                        </div>
                        {q.answer && (
                          <div className="ml-11 mt-3 p-3 bg-purple-600/20 rounded-lg border-l-2 border-purple-500">
                            <div className="text-purple-400 text-sm font-medium mb-1">Host Answer</div>
                            <p className="text-gray-300">{q.answer}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-3 ml-11">
                          <button className="flex items-center gap-1 text-gray-500 hover:text-purple-400 text-sm">
                            <ThumbsUp className="h-4 w-4" />
                            {q.upvotes}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No questions yet. Be the first to ask!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <div className="bg-gray-800/50 rounded-xl p-6 sticky top-4">
              {/* Countdown */}
              {countdown && !isPast && (
                <div className="mb-6">
                  <div className="text-gray-400 text-sm mb-2">Starts in</div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                      <div className="text-2xl font-bold text-white">{countdown.days}</div>
                      <div className="text-gray-500 text-xs">Days</div>
                    </div>
                    <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                      <div className="text-2xl font-bold text-white">{countdown.hours}</div>
                      <div className="text-gray-500 text-xs">Hours</div>
                    </div>
                    <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                      <div className="text-2xl font-bold text-white">{countdown.minutes}</div>
                      <div className="text-gray-500 text-xs">Minutes</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between mb-6 text-sm">
                <span className="flex items-center gap-2 text-gray-400">
                  <Users className="h-4 w-4" />
                  {webinar.registration_count} registered
                </span>
                {webinar.max_attendees && (
                  <span className="text-gray-500">
                    {webinar.max_attendees - webinar.registration_count} spots left
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              {isLive ? (
                webinar.is_registered && webinar.join_url ? (
                  <a
                    href={webinar.join_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium"
                  >
                    <ExternalLink className="h-5 w-5" />
                    Join Live Session
                  </a>
                ) : (
                  <button
                    onClick={handleRegister}
                    disabled={registering}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded-lg text-white font-medium"
                  >
                    {registering ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Radio className="h-5 w-5" />
                        Register & Join
                      </>
                    )}
                  </button>
                )
              ) : isPast ? (
                webinar.has_recording ? (
                  <button
                    onClick={handleWatchRecording}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium"
                  >
                    <PlayCircle className="h-5 w-5" />
                    Watch Recording
                  </button>
                ) : (
                  <div className="text-center text-gray-500 py-3">
                    This webinar has ended
                  </div>
                )
              ) : webinar.is_registered ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 py-3 bg-green-600/20 text-green-400 rounded-lg">
                    <CheckCircle className="h-5 w-5" />
                    You're registered!
                  </div>
                  <button
                    onClick={handleUnregister}
                    className="w-full py-2 text-gray-400 hover:text-red-400 text-sm"
                  >
                    Cancel Registration
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={registering || !webinar.can_register}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 rounded-lg text-white font-medium"
                >
                  {registering ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Bell className="h-5 w-5" />
                      Register Now
                    </>
                  )}
                </button>
              )}

              {/* Add to Calendar */}
              {!isPast && webinar.is_registered && (
                <button className="w-full flex items-center justify-center gap-2 mt-3 py-2 text-gray-400 hover:text-white text-sm">
                  <Calendar className="h-4 w-4" />
                  Add to Calendar
                </button>
              )}
            </div>

            {/* Host Info */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Your Host</h3>
              <div className="flex items-start gap-4">
                {webinar.host?.avatar ? (
                  <img
                    src={webinar.host.avatar}
                    alt={webinar.host.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-white" />
                  </div>
                )}
                <div>
                  <h4 className="text-white font-medium">{webinar.host?.name}</h4>
                  {webinar.host?.title && (
                    <p className="text-purple-400 text-sm">{webinar.host.title}</p>
                  )}
                  {webinar.host?.bio && (
                    <p className="text-gray-400 text-sm mt-2">{webinar.host.bio}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Share */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Share2 className="h-5 w-5 text-purple-400" />
                Share This Webinar
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(webinar.title)}`, '_blank')}
                  className="flex-1 py-2 bg-[#1DA1F2] hover:bg-[#1a8cd8] rounded-lg text-white text-sm"
                >
                  Twitter
                </button>
                <button
                  onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')}
                  className="flex-1 py-2 bg-[#0A66C2] hover:bg-[#094d92] rounded-lg text-white text-sm"
                >
                  LinkedIn
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Link copied!');
                  }}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebinarDetailPage;
