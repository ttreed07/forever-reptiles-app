"use client";

import { useState } from "react";

export default function MasterModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState("users");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-purple-500/40 w-full max-w-2xl rounded-2xl p-5 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">👑</span>
            <div>
              <h3 className="text-base font-extrabold text-white">Master Administration</h3>
              <p className="text-[11px] text-purple-300">User Access Control & Global Guidelines</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 text-2xl font-bold">&times;</button>
        </div>
        
        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button onClick={() => setActiveTab("users")} className={`py-2 rounded-lg font-bold ${activeTab === 'users' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>👥 Users</button>
          <button onClick={() => setActiveTab("rules")} className={`py-2 rounded-lg font-bold ${activeTab === 'rules' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>📖 Guidelines</button>
          <button onClick={() => setActiveTab("feedback")} className={`py-2 rounded-lg font-bold ${activeTab === 'feedback' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>💭 Feedback</button>
        </div>

        <div className="space-y-3">
          <p className="text-[11px] text-slate-400 text-center py-8 border border-dashed border-slate-700 rounded-xl">
            {activeTab === 'users' ? "Platform user management will load here." : 
             activeTab === 'rules' ? "Global species guidelines editor will load here." : 
             "User feedback submissions will load here."}
          </p>
        </div>
      </div>
    </div>
  );
}