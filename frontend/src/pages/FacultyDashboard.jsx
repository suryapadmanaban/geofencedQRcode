import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QRCode from 'react-qr-code';
import { Button, Input, Card } from '../components/ui';
import { Plus, Users, Clock, LogOut, QrCode, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import { API_BASE } from '../config';

export default function FacultyDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [className, setClassName] = useState('');
  const [duration, setDuration] = useState(15);
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    fetchSessions();
  }, []);

  // Poll for attendance when a session is active
  useEffect(() => {
    let interval;
    if (activeSession && activeSession.id) {
      fetchAttendance(activeSession.id);
      interval = setInterval(() => fetchAttendance(activeSession.id), 3000);
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${API_BASE}/faculty/sessions`);
      if (res.data) setSessions(res.data);
    } catch (err) {
      console.error('Failed to fetch sessions');
    }
  };

  const fetchAttendance = async (sessionId) => {
    try {
      const res = await axios.get(`${API_BASE}/faculty/attendance/${sessionId}`);
      if (res.data) setAttendance(res.data);
    } catch (err) {
      console.error('Failed to fetch attendance');
    }
  };

  const handleExport = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/faculty/export/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const url = window.URL.createObjectURL(new Blob([res.data], { type: mimeType }));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = res.headers['content-disposition'];
      let fileName = `attendance_session_${sessionId}.xlsx`;
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch && fileNameMatch.length === 2) {
          fileName = fileNameMatch[1];
        }
      }
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download report');
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!className) return;
    
    setLoading(true);
    
    const sendRequest = async (lat, lng) => {
      try {
        const res = await axios.post(`${API_BASE}/faculty/create-session`, {
          class_name: className,
          duration_minutes: parseInt(duration),
          latitude: lat,
          longitude: lng
        });
        
        if (res.data) {
          setSessions([res.data, ...sessions]);
          setActiveSession(res.data);
          setClassName('');
        }
      } catch (err) {
        alert("Error: " + (err.response?.data?.detail || "Could not create session"));
      } finally {
        setLoading(false);
      }
    };

    // Fallback location if geolocation is blocked
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => sendRequest(pos.coords.latitude, pos.coords.longitude),
        (err) => {
          console.error("Location error:", err);
          alert("Error: Could not get your location. Please ensure GPS is enabled and permissions are granted. Session will be created at a default location.");
          sendRequest(12.9716, 77.5946); // Default as fallback
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by this browser. Using default location.");
      sendRequest(12.9716, 77.5946);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              Faculty Portal
            </h1>
            <p className="text-slate-400">Welcome, {user?.name || 'Faculty'}</p>
          </div>
          <Button variant="secondary" onClick={() => { logout(); navigate('/login'); }}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Create Session Card */}
          <div className="lg:col-span-4">
            <Card className="glass-card shadow-2xl">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-blue-400">
                <Plus className="w-5 h-5" />
                New Session
              </h2>
              
              <form onSubmit={handleCreateSession} className="space-y-4">
                <Input
                  label="Class Name"
                  placeholder="e.g. Mathematics 101"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  required
                />
                <Input
                  label="Duration (mins)"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={loading}>
                  {loading ? 'Starting...' : 'Generate QR Code'}
                </Button>
                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 italic">
                  <MapPin className="w-3 h-3 text-blue-500" />
                  High-accuracy GPS enabled
                </div>
              </form>

              {/* QR CODE IMAGE - Guaranteed to work */}
              {activeSession && (
                <div className="mt-8 pt-8 border-t border-white/10 text-center">
                  <div className="bg-white p-4 rounded-3xl inline-block shadow-2xl mb-4 overflow-hidden">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${activeSession.id}&margin=10`}
                      alt="Attendance QR Code"
                      className="w-[200px] h-[200px] block mx-auto"
                      onLoad={() => console.log("QR Image loaded successfully")}
                      onError={() => alert("Failed to load QR Image")}
                    />
                  </div>
                  <h3 className="font-bold text-white mb-1">{activeSession.class_name}</h3>
                  <div className="text-blue-400 font-mono text-xl font-bold mb-1">CODE: {activeSession.id}</div>
                  <p className="text-[10px] text-slate-500 mb-6 flex items-center justify-center gap-2">
                    <Clock className="w-3 h-3" />
                    Valid until {new Date(activeSession.expiry_time).toLocaleTimeString()}
                  </p>

                  <div className="bg-black/20 rounded-2xl p-4 text-left border border-white/5">
                    <h4 className="text-[10px] font-bold text-blue-400 uppercase mb-3 flex justify-between">
                      Live Attendance
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {attendance.map((att) => (
                        <div key={att.id} className="flex justify-between items-center text-xs">
                          <span className="text-slate-200">{att.student_name}</span>
                          <span className="text-slate-500">{new Date(att.timestamp + (!att.timestamp.endsWith('Z') ? 'Z' : '')).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                      ))}
                      {attendance.length === 0 && (
                        <p className="text-[10px] text-slate-600 text-center py-2 italic">Waiting for scans...</p>
                      )}
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full mt-6 text-slate-400 border-white/5"
                    onClick={() => setActiveSession(null)}
                  >
                    Close QR
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Session List Card */}
          <div className="lg:col-span-8">
            <Card className="glass-card shadow-2xl">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-blue-400">
                <Clock className="w-5 h-5" />
                History
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-white/5">
                      <th className="pb-4 font-medium">Class</th>
                      <th className="pb-4 font-medium">Date</th>
                      <th className="pb-4 font-medium">Status</th>
                      <th className="pb-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {sessions.map((s) => {
                      const isExpired = s.expiry_time ? new Date() > new Date(s.expiry_time + (!s.expiry_time.endsWith('Z') ? 'Z' : '')) : false;
                      return (
                        <tr key={s.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 font-bold text-white">{s.class_name}</td>
                          <td className="py-4 text-slate-400">{new Date(s.start_time + (!s.start_time.endsWith('Z') ? 'Z' : '')).toLocaleDateString()}</td>
                          <td className="py-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${isExpired ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                              {isExpired ? 'EXPIRED' : 'ACTIVE'}
                            </span>
                          </td>
                          <td className="py-4 text-right flex justify-end gap-2">
                            <Button 
                              variant="secondary" 
                              size="sm"
                              className="text-xs px-3"
                              onClick={() => setActiveSession(s)}
                            >
                              Open
                            </Button>
                            <Button 
                              variant="secondary" 
                              size="sm"
                              className="text-xs px-3 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                              onClick={() => handleExport(s.id)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
