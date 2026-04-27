import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode';
import { Button, Card } from '../components/ui';
import { Scan, CheckCircle, AlertCircle, MapPin, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { API_BASE } from '../config';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showManual, setShowManual] = useState(false);
  const processingScan = React.useRef(false);

  useEffect(() => {
    let html5QrCode = null;
    
    if (scanning && !showManual) {
      const timer = setTimeout(() => {
        const readerElement = document.getElementById("reader");
        if (!readerElement) return;

        html5QrCode = new Html5Qrcode("reader");
        
        const config = { 
          fps: 10, 
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdge * 0.7);
            return { width: qrboxSize, height: qrboxSize };
          },
          aspectRatio: 1.0
        };

        html5QrCode.start(
          { facingMode: "environment" }, 
          config,
          onScanSuccess,
          onScanFailure
        ).catch(err => {
          console.error("Camera start error:", err);
          setScanning(false);
          setStatus({ type: 'error', message: "Failed to start camera. Please ensure permissions are granted." });
        });
      }, 300);

      return () => {
        clearTimeout(timer);
        if (html5QrCode) {
          if (html5QrCode.isScanning) {
            html5QrCode.stop().catch(err => console.error("Stop failed", err));
          }
        }
      };
    }
  }, [scanning, showManual]);

  async function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualCode) return;
    onScanSuccess(manualCode);
  }

  async function onScanSuccess(decodedText) {
    if (processingScan.current) return;
    
    console.log("DEBUG: Decoded QR Raw:", decodedText);
    const cleanText = decodedText.trim();
    
    processingScan.current = true;
    setScanning(false);
    setShowManual(false);
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      let sessionId;
      try {
        const data = JSON.parse(cleanText);
        sessionId = data.sessionId || data.id || cleanText;
      } catch (e) {
        sessionId = cleanText;
      }

      const finalId = parseInt(sessionId);
      if (isNaN(finalId)) {
        throw new Error("Invalid session code. Please check again.");
      }

      console.log("DEBUG: Validated Session ID:", finalId);

      // Wrap geolocation in a promise to use await
      const getPos = async () => {
        const options = { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 };
        try {
          return await new Promise((resolve, reject) => {
            if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));
            navigator.geolocation.getCurrentPosition(resolve, reject, options);
          });
        } catch (err) {
          // If high accuracy times out (code 3), try one more time with low accuracy
          if (err.code === 3) {
            console.warn("High accuracy timed out, retrying with low accuracy...");
            return await new Promise((resolve, reject) => 
              navigator.geolocation.getCurrentPosition(resolve, reject, { ...options, enableHighAccuracy: false, timeout: 10000 })
            );
          }
          throw err;
        }
      };

      const pos = await getPos();
      const { latitude, longitude } = pos.coords;

      const res = await axios.post(`${API_BASE}/student/mark-attendance`, {
        session_id: finalId,
        latitude,
        longitude
      });
      
      setStatus({ type: 'success', message: 'Attendance marked successfully!' });
    } catch (err) {
      console.error("DEBUG: Error in marking attendance:", err);
      let errorMsg = 'An error occurred. Please try again.';
      
      if (err.code === 1) { // Geolocation PERMISSION_DENIED
        errorMsg = 'Location access is denied. Please enable GPS and allow location permissions in your browser settings.';
      } else if (err.code === 2) { // POSITION_UNAVAILABLE
        errorMsg = 'Location unavailable. Ensure your GPS is working.';
      } else if (err.code === 3) { // TIMEOUT
        errorMsg = 'Location request timed out. Try moving to a clearer area.';
      } else if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setStatus({ type: 'error', message: errorMsg });
    } finally {
      setLoading(false);
      processingScan.current = false;
    }
  }

  function onScanFailure(error) {
    // Suppress noise
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8">
      {/* Header */}
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Student Portal</h1>
          <p className="text-slate-400 text-sm">Hello, {user?.name}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => { logout(); navigate('/login'); }} className="flex items-center gap-2">
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </header>

      {!window.isSecureContext && (
        <div className="max-w-lg mx-auto mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
          <AlertCircle className="text-amber-500 shrink-0 w-5 h-5 mt-0.5" />
          <div className="text-xs text-amber-200/80">
            <p className="font-bold mb-1">Insecure Context Detected</p>
            <p>Geolocation (GPS) usually requires <strong>HTTPS</strong> to work on mobile. If location fails, please use a secure tunnel (like Ngrok) or access via localhost on your PC.</p>
          </div>
        </div>
      )}

      <main className="max-w-lg mx-auto pb-12">
        <Card className="glass-card !p-6 md:!p-8 shadow-2xl border-white/5">
          <div className="mb-8 text-center">
            <div className="w-16 h-16 rounded-2xl premium-gradient mx-auto flex items-center justify-center mb-4 shadow-2xl shadow-blue-500/20">
              {showManual ? <MapPin className="w-8 h-8 text-white" /> : <Scan className="w-8 h-8 text-white" />}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {showManual ? 'Enter Session Code' : 'Mark Attendance'}
            </h2>
            <p className="text-slate-400 text-sm">
              {showManual ? 'Type the code provided by your instructor' : 'Scan the QR code shown by your teacher'}
            </p>
          </div>

          <div className="space-y-4">
            {!scanning && !loading && !showManual && status.type === '' && (
              <>
                <Button onClick={() => setScanning(true)} className="w-full h-14 text-lg font-bold shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3">
                  <Scan className="w-6 h-6" />
                  Start Scanning
                </Button>
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#1e293b] px-4 text-slate-500">Or</span>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => setShowManual(true)} className="w-full h-12 text-slate-300">
                  Enter Code Manually
                </Button>
              </>
            )}

            {showManual && !loading && (
              <motion.form 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleManualSubmit} 
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Session ID</label>
                  <input 
                    type="number"
                    placeholder="Enter session code"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full h-14 text-lg font-bold" disabled={!manualCode}>
                  Verify & Mark
                </Button>
                <button 
                  type="button"
                  onClick={() => setShowManual(false)}
                  className="w-full text-sm text-slate-500 hover:text-white transition-colors py-2"
                >
                  Back to Scanner
                </button>
              </motion.form>
            )}

            <AnimatePresence>
              {scanning && !showManual && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative"
                >
                  <div id="reader" className="overflow-hidden rounded-3xl border-2 border-blue-500/30 bg-black/40 min-h-[300px]"></div>
                  <Button 
                    variant="outline" 
                    onClick={() => setScanning(false)} 
                    className="mt-6 w-full border-white/10 text-slate-400"
                  >
                    Cancel Scan
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {loading && (
              <div className="py-12 flex flex-col items-center">
                <div className="relative w-16 h-16 mb-6">
                  <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-slate-300 font-medium animate-pulse text-center">
                  Verifying location & status...<br/>
                  <span className="text-xs text-slate-500 mt-2 block">Ensure GPS is active</span>
                </p>
              </div>
            )}

            {status.message && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`p-6 md:p-8 rounded-3xl border ${
                  status.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                } text-center`}
              >
                {status.type === 'success' ? (
                  <div className="w-16 h-16 bg-emerald-500 rounded-full mx-auto flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-rose-500 rounded-full mx-auto flex items-center justify-center mb-6 shadow-xl shadow-rose-500/20">
                    <AlertCircle className="w-10 h-10 text-white" />
                  </div>
                )}
                <h3 className="font-bold text-xl mb-2">
                  {status.type === 'success' ? 'Success!' : 'Failed'}
                </h3>
                <p className="text-sm opacity-80 mb-8">{status.message}</p>
                <Button 
                  variant="secondary" 
                  onClick={() => { setStatus({ type: '', message: '' }); setScanning(false); setManualCode(''); }}
                  className="w-full h-12"
                >
                  Dismiss
                </Button>
              </motion.div>
            )}
          </div>
        </Card>

        <div className="mt-8 flex items-start gap-4 p-5 glass-card rounded-3xl border-white/5 bg-white/5">
          <div className="p-2 rounded-xl bg-blue-500/10">
            <MapPin className="text-blue-400 w-5 h-5" />
          </div>
          <div className="text-[11px] leading-relaxed text-slate-400">
            <strong className="text-slate-200 block mb-1 uppercase tracking-wider">Security Requirements</strong>
            <ul className="list-disc list-inside space-y-1">
              <li>Must be within 500m of the classroom</li>
              <li>GPS/Location services must be enabled</li>
              <li>Attendance can only be marked once per session</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
