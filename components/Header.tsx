"use client";

import { useState } from "react";
import Link from "next/link";
import { db } from "../lib/supabase";
import SettingsModal from "./SettingsModal";
import MasterModal from "./MasterModal";

export default function Header({ loading = false, isMaster = false, activeUser = "Trevor", members = [] }: { loading?: boolean, isMaster?: boolean, activeUser?: string, members?: string[] }) {
  const [showSettings, setShowSettings] = useState(false);
  const [showMaster, setShowMaster] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 mb-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div>
            <div className="flex items-center gap-2">
              <Link href="/" className="text-lg font-bold text-emerald-400 tracking-tight">ForeverReptiles</Link>
              <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></span>
            </div>
            <p className="text-[11px] text-slate-400">Next.js v2</p>
          </div>
          <div className="flex items-center gap-1.5">
            {isMaster && (
              <button onClick={() => setShowMaster(true)} className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold px-2.5 py-1.5 rounded-lg transition">👑 Master</button>
            )}
            <select 
              value={activeUser}
              onChange={(e) => {
                // In a full implementation, we will save this to localStorage/state to track the active logger
                if (typeof window !== 'undefined') localStorage.setItem('fr_active_user', e.target.value);
              }} 
              className="bg-slate-800 text-emerald-300 text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none"
            >
              {members.length > 0 ? (
                members.map(m => <option key={m} value={m}>{m}</option>)
              ) : (
                <><option value="Trevor">Trevor</option><option value="Hannah">Hannah</option><option value="Oakley">Oakley</option></>
              )}
            </select>
            <button onClick={() => setShowSettings(true)} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold transition">👥 / ⚙️</button>
            <button onClick={() => db.auth.signOut()} className="bg-slate-800 hover:bg-slate-700 text-slate-400 px-2 py-1.5 rounded-lg border border-slate-700 text-xs transition">🔒</button>
          </div>
        </div>
      </header>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} members={members} />
      <MasterModal isOpen={showMaster} onClose={() => setShowMaster(false)} />
    </>
  );
}