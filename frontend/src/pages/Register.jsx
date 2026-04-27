import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Button, Input, Card } from '../components/ui';
import { UserPlus, ShieldCheck, User, Mail, Lock, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';

import { API_BASE } from '../config';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    register_number: '',
    roll_number: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post(`${API_BASE}/auth/register`, formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[500px]"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl premium-gradient mb-6 shadow-2xl shadow-blue-500/20">
            <UserPlus className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Create Account</h1>
          <p className="text-slate-400 text-lg">Join the smart attendance system</p>
        </div>

        <Card className="glass-card !p-8 border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="h-12 bg-white/5"
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="h-12 bg-white/5"
              />
            </div>

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="h-12 bg-white/5"
            />

            {formData.role === 'student' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Register Number"
                  placeholder="e.g. 12345678"
                  value={formData.register_number}
                  onChange={(e) => setFormData({ ...formData, register_number: e.target.value })}
                  required
                  className="h-12 bg-white/5"
                />
                <Input
                  label="Roll Number"
                  placeholder="e.g. 21CS001"
                  value={formData.roll_number}
                  onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                  required
                  className="h-12 bg-white/5"
                />
              </div>
            )}

            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-300 ml-1">I am a...</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'student' })}
                  className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                    formData.role === 'student'
                      ? 'border-blue-500 bg-blue-500/10 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                      : 'border-white/5 bg-white/5 text-slate-400 hover:border-white/10'
                  }`}
                >
                  <User className="w-8 h-8" />
                  <span className="font-bold">Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'faculty' })}
                  className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                    formData.role === 'faculty'
                      ? 'border-blue-500 bg-blue-500/10 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                      : 'border-white/5 bg-white/5 text-slate-400 hover:border-white/10'
                  }`}
                >
                  <UserCircle className="w-8 h-8" />
                  <span className="font-bold">Faculty</span>
                </button>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm font-medium"
              >
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              className="w-full h-14 text-lg font-bold shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Register Now'}
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-bold underline-offset-4 hover:underline transition-all">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
