
import React, { useState } from 'react';
import { supabase } from '../services/supabaseConfig';
import * as nodeAuth from '../services/nodeAuthService';
import { Building2, ArrowRight, Loader2, Mail, Lock, AlertCircle } from 'lucide-react';

interface LoginProps {
  onDemoLogin: () => void;
  onNodeLogin?: (user: nodeAuth.NodeUser, token: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onDemoLogin, onNodeLogin }) => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<{message: string, detail?: string} | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const isAuthConfigured = () => {
    const currentUrl = (supabase as { supabaseUrl?: string }).supabaseUrl ?? '';
    return !currentUrl.includes('placeholder.supabase.co') && !currentUrl.includes('YOUR_');
  };

  const checkConfig = () => {
    if (!isAuthConfigured()) {
      setError({
        message: 'Use app account or Demo',
        detail: 'Enter email and password above and click Sign Up / Log In to use the app account, or use "Enter as Guest (Demo)" below. If you see this after clicking Sign Up, the server may be offline.'
      });
      return false;
    }
    return true;
  };

  const handleEmailAuth = async () => {
    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setError({ message: "Missing Fields", detail: "Please enter both email and password." });
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg('');

    // When Supabase is not configured, use Node backend auth (if onNodeLogin was passed)
    const useNodeAuth = !isAuthConfigured() && onNodeLogin;

    try {
      if (useNodeAuth) {
        const data = isSignUp
          ? await nodeAuth.register(cleanEmail, cleanPass)
          : await nodeAuth.login(cleanEmail, cleanPass);
        onNodeLogin(data.user, data.token);
        return;
      }

      if (!isAuthConfigured()) {
        setError({
          message: 'Use app account or Demo',
          detail: 'Sign up with email and password above (app account), or use "Enter as Guest (Demo)" below. Make sure the server is running (npm run start).'
        });
        setLoading(false);
        return;
      }

      if (!checkConfig()) {
        setLoading(false);
        return;
      }

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPass
        });
        if (error) throw error;

        if (data.user && !data.session) {
          setSuccessMsg("Account created! Please check your email inbox to confirm registration.");
          setIsSignUp(false);
        } else {
          setSuccessMsg("Account created! Logging you in...");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPass
        });
        if (error) throw error;
      }
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = (err: any) => {
    console.error(err);
    let msg = err.message || "Authentication failed.";
    let detail = "";
    
    if (msg.includes("configuration") || msg.includes("URL")) {
        detail = "Check your supabaseConfig.ts file.";
    } else if (msg.includes("Invalid login credentials")) {
        detail = isSignUp 
          ? "Could not create user. Try a different email." 
          : "User not found or wrong password. If you are new, please Sign Up first.";
    } else if (msg.includes("rate limit")) {
        detail = "Too many attempts. Please wait a moment.";
    } else if (msg.includes("Email not confirmed")) {
        detail = "Please check your inbox and verify your email address.";
    }
    
    setError({ message: msg, detail });
    setLoading(false);
  };

  return (
    <div className="h-[100dvh] bg-brand-600 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-900 opacity-10 rounded-full translate-x-1/3 translate-y-1/3"></div>

      <div className="z-10 text-center space-y-6 max-w-sm w-full animate-fade-in">
        <div className="flex justify-center mb-4">
           <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center text-brand-600">
             <Building2 size={40} />
           </div>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold">RE Investor Pro</h1>
          <p className="text-brand-100 text-sm">Real Estate Tracker</p>
        </div>

        {/* When auth not configured, suggest Demo */}
        {!isAuthConfigured() && (
          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/30 text-center text-sm text-brand-100">
            Use the form to <strong className="text-white">Sign up / Log in</strong> with the app account, or <strong className="text-white">Enter as Guest (Demo)</strong> below.
          </div>
        )}

        {/* Auth Form */}
        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20 space-y-4 shadow-2xl">
          <div className="flex bg-black/20 p-1 rounded-lg mb-4">
            <button 
              onClick={() => { setIsSignUp(false); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${!isSignUp ? 'bg-white text-brand-600 shadow-sm' : 'text-brand-200 hover:text-white'}`}
            >
              Log In
            </button>
            <button 
              onClick={() => { setIsSignUp(true); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${isSignUp ? 'bg-white text-brand-600 shadow-sm' : 'text-brand-200 hover:text-white'}`}
            >
              Sign Up
            </button>
          </div>

          <h3 className="text-sm font-semibold text-white mb-2">
            {isSignUp ? 'Create New Account' : 'Welcome Back'}
          </h3>
          
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-brand-200" size={16} />
            <input 
              type="email" 
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-black/20 border border-brand-400/30 rounded-lg py-2.5 pl-10 pr-3 text-sm text-white placeholder-brand-200 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-brand-200" size={16} />
            <input 
              type="password" 
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-black/20 border border-brand-400/30 rounded-lg py-2.5 pl-10 pr-3 text-sm text-white placeholder-brand-200 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/40 p-3 rounded-lg text-left">
              <div className="flex items-center gap-2 text-red-200 font-bold text-xs">
                <AlertCircle size={14} />
                <span>{error.message}</span>
              </div>
              {error.detail && <p className="text-[10px] text-red-300 mt-1">{error.detail}</p>}
            </div>
          )}

          {successMsg && (
            <div className="bg-green-500/20 border border-green-500/40 p-3 rounded-lg text-xs text-green-200">
              {successMsg}
            </div>
          )}

          <button 
            onClick={handleEmailAuth}
            disabled={loading}
            className="w-full bg-white text-brand-700 py-3 rounded-lg font-bold shadow-lg flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
            <span>{isSignUp ? 'Sign Up' : 'Log In'}</span>
          </button>
        </div>

        {/* Demo / Guest – enter without account */}
        <div className="pt-2 border-t border-white/20">
          <p className="text-brand-200 text-xs mb-2">No account? Enter with sample data</p>
          <button 
            onClick={onDemoLogin}
            className="w-full py-3 px-4 bg-white/20 hover:bg-white/30 border border-white/40 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <span>Enter as Guest (Demo)</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <p className="absolute bottom-6 text-[10px] text-brand-200 uppercase tracking-widest font-bold">
        Secure Property Management • v2.0
      </p>
    </div>
  );
};
