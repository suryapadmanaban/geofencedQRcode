import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import QRCode from 'react-qr-code';
import { motion } from 'framer-motion';
import { 
  Users, 
  Clock, 
  ArrowLeft, 
  CheckCircle2, 
  Download,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components/ui';
import { API_BASE } from '../config';

export default function SessionView() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [timeLeft, setTimeLeft] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessionData();
    const interval = setInterval(fetchSessionData, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchSessionData = async () => {
    try {
      const sessRes = await axios.get(`${API_BASE}/sessions/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setSession(sessRes.data);
      
      const attRes = await axios.get(`${API_BASE}/sessions/${id}/attendance`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setAttendance(attRes.data);
      
      calculateTimeLeft(sessRes.data.expires_at);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch session data', err);
    }
  };

  const calculateTimeLeft = (expiry) => {
    const difference = new Date(expiry) - new Date();
    if (difference > 0) {
      const mins = Math.floor((difference / 1000 / 60) % 60);
      const secs = Math.floor((difference / 1000) % 60);
      setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
    } else {
      setTimeLeft('Expired');
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${API_BASE}/sessions/${id}/export`, {
        headers: { Authorization: `Bearer ${user.token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_${session.class_name}.xlsx`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      alert('Export failed');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        <button 
          onClick={() => navigate('/faculty')}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: QR Code */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="glass-card !p-8 text-center border-blue-500/20 shadow-2xl shadow-blue-500/10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 text-sm font-bold mb-6">
                <ShieldCheck className="w-4 h-4" />
                SECURE ATTENDANCE
              </div>
              
              <h1 className="text-2xl font-bold text-white mb-2">{session.class_name}</h1>
              
              <div className="flex items-center justify-center gap-2 text-slate-400 mb-8">
                <Clock className="w-4 h-4" />
                <span className={timeLeft === 'Expired' ? 'text-red-400 font-bold' : 'font-mono'}>
                  {timeLeft === 'Expired' ? 'SESSION EXPIRED' : `Time Remaining: ${timeLeft}`}
                </span>
              </div>

              <div className="bg-white p-6 rounded-3xl inline-block shadow-2xl mb-8">
                <QRCode 
                  value={id.toString()} 
                  size={200}
                  level="H"
                />
              </div>

              <p className="text-sm text-slate-500 mb-6 px-4">
                Ask students to scan this code using their Student Portal while within 100 meters.
              </p>

              <Button 
                variant="outline" 
                className="w-full border-white/5 bg-white/5 hover:bg-white/10"
                onClick={handleExport}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Attendance
              </Button>
            </Card>
          </div>

          {/* Right Column: Attendance List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Users className="text-blue-500" />
                Recent Attendance
                <span className="ml-3 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm">
                  {attendance.length} Present
                </span>
              </h2>
            </div>

            <Card className="glass-card !p-0 overflow-hidden border-white/5">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="px-6 py-4 text-sm font-semibold text-slate-300">Student Name</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-300">Reg No</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-300">Roll No</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-300">Time</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-300 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {attendance.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                          No attendance recorded yet.
                        </td>
                      </tr>
                    ) : (
                      attendance.map((record) => (
                        <motion.tr 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={record.id} 
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                                {record.student_name.charAt(0)}
                              </div>
                              <span className="text-white font-medium">{record.student_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-sm">
                            {record.register_number}
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-sm">
                            {record.roll_number}
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-sm">
                            {new Date(record.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              VERIFIED
                            </span>
                          </td>
                        </motion.tr>
                      ))
                    )}
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
