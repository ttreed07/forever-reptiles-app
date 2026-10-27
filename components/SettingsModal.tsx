"use client";

import { useState, useEffect } from "react";
import { getCustomFeeders } from "../lib/husbandry";

export default function SettingsModal({ isOpen, onClose, members }: { isOpen: boolean, onClose: () => void, members: string[] }) {
  const [isEditingFeeders, setIsEditingFeeders] = useState(false);
  const [feeders, setFeeders] = useState<{n: string, m: number}[]>([]);

  // Load the current feeders from local storage/husbandry lib when modal opens
  useEffect(() => {
    if (isOpen) {
      setFeeders(getCustomFeeders());
      setIsEditingFeeders(false);
    }
  }, [isOpen]);

  const handleSaveFeeders = () => {
    // Save to local storage for the husbandry engine to read
    localStorage.setItem('fr_feeders', JSON.stringify(feeders));
    setIsEditingFeeders(false);
    // Force a quick page refresh to instantly apply the new breakpoints across the app
    window.location.reload(); 
  };

  const handleResetFeeders = () => {
    if (confirm("Reset all custom feeders back to default weights?")) {
      localStorage.removeItem('fr_feeders');
      setFeeders(getCustomFeeders());
    }
  };

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
          
          {isEditingFeeders ? (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3 mb-3 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white">Custom Feeder Configuration</span>
                <button onClick={handleResetFeeders} className="text-[10px] text-red-400 hover:underline">Reset Defaults</button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {feeders.map((f, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input 
                      type="text" 
                      value={f.n} 
                      onChange={e => { const newF = [...feeders]; newF[i].n = e.target.value; setFeeders(newF); }} 
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500" 
                      placeholder="Feeder Name" 
                    />
                    <input 
                      type="number" 
                      value={f.m} 
                      onChange={e => { const newF = [...feeders]; newF[i].m = Number(e.target.value); setFeeders(newF); }} 
                      className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-right focus:outline-none focus:border-emerald-500" 
                      placeholder="Max g" 
                    />
                    <span className="text-xs text-slate-400 font-bold shrink-0">g</span>
                    <button 
                      onClick={() => { const newF = feeders.filter((_, idx) => idx !== i); setFeeders(newF); }} 
                      className="text-red-400 hover:bg-red-400/20 font-bold px-2 py-1 rounded-lg transition shrink-0"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setFeeders([...feeders, {n: '', m: 0}])} 
                className="text-[11px] text-emerald-400 font-bold w-full text-left px-1 hover:underline"
              >
                + Add Feeder Size
              </button>
              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button onClick={() => setIsEditingFeeders(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-lg text-xs transition">Cancel</button>
                <button onClick={handleSaveFeeders} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-lg text-xs shadow transition">Save Sizes</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setIsEditingFeeders(true)} className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-2 rounded-xl text-xs mb-3 transition shadow-sm">
              🐁 Configure Custom Feeder Sizes
            </button>
          )}
          
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