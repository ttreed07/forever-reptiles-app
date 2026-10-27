"use client";

import { useState } from "react";
import { db } from "../lib/supabase";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  async function signInWithGoogle() {
    const { error } = await db.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) setError(error.message);
  }

  async function signInWithEmail() {
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
  }

  async function signUpWithEmail() {
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    const { error } = await db.auth.signUp({ email, password });
    if (error) setError(error.message);
    else {
      setMsg(`Check your email! We sent a verification link to ${email}.`);
      setError("");
    }
  }

  if (msg) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm bg-slate-900 border border-emerald-500/50 rounded-3xl p-7 text-center shadow-2xl">
          <h2 className="text-xl font-bold text-emerald-400 mb-2">Check Your Email!</h2>
          <p className="text-sm text-slate-300 mb-4">{msg}</p>
          <button onClick={() => window.location.reload()} className="bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm">Return to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-7 text-center space-y-5 shadow-2xl">
        <div>
          <div className="text-4xl mb-1">🐍</div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">ForeverReptiles</h2>
          <p className="text-xs text-slate-400">Cloud Husbandry & Collection Tracker</p>
        </div>
        
        <button onClick={signInWithGoogle} className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 px-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow transition">
          Continue with Google
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px bg-slate-800 flex-1"></div>
          <span className="text-[10px] uppercase text-slate-500 font-bold">Or Email</span>
          <div className="h-px bg-slate-800 flex-1"></div>
        </div>

        <div className="space-y-2">
          <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
          {error && <p className="text-xs text-red-400 font-semibold py-1">{error}</p>}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button onClick={signUpWithEmail} className="w-full bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold py-2.5 rounded-xl text-xs transition">Create Account</button>
            <button onClick={signInWithEmail} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition">Sign In</button>
          </div>
        </div>
      </div>
    </div>
  );
}