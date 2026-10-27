"use client";

import { useState } from "react";

export default function SettingsModal({ isOpen, onClose, members }: { isOpen: boolean, onClose: () => void, members: string[] }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-40 flex items-end justify-center sm:items-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-white">Account Settings</h3>
          <button onClick={onClose} className="text-slate-400 text-2xl font-bold">&times;</button>
        </div>
        
        <div className="space-y-1.5">
          <p className="text-[11px] text-slate-400">Account Caretakers:</p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {members.map(m => (
              <div key={m} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 flex justify-between items-center text-xs">
                <span className="font-bold text-white">{m}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="pt-3 border-t border-slate-800">
          <h4 className="text-[11px] font-bold text-emerald-400 mb-2">⚙️ App Preferences</h4>
          <button className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-2 rounded-xl text-xs mb-3 transition">🐁 Configure Custom Feeder Sizes</button>
          <p className="text-[10px] text-slate-400 mb-2">Species feeding rule overrides will be managed here.</p>
        </div>
        
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <h4 className="text-[11px] font-bold text-sky-400">📦 Data Backup & Export</h4>
          <div className="grid grid-cols-2 gap-2">
            <button className="bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold py-2 rounded-xl text-xs transition">⬇️ Export JSON Backup</button>
            <button className="bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold py-2 rounded-xl text-xs transition">📊 Export CSV Data</button>
          </div>
        </div>
      </div>
    </div>
  );
}