"use client";

import { useState, useEffect } from "react";
import { db } from "../lib/supabase";
import { getHusbandryRules } from "../lib/husbandry";

export default function LogCareModal({ isOpen, onClose, reptile, onLogAdded, initialAction = "Feeding" }: any) {
  const [actionType, setActionType] = useState(initialAction);
  const [dateStr, setDateStr] = useState("");
  const [weight, setWeight] = useState("");
  const [preyWeight, setPreyWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActionType(initialAction);
      const now = new Date();
      setDateStr(new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
      setWeight("");
      setPreyWeight("");
      setNotes("");
      setIsSaving(false);
    }
  }, [isOpen, initialAction]);

  if (!isOpen || !reptile) return null;

  const rules = getHusbandryRules(reptile);
  
  // Determine primary category for UI toggles
  let cat = "chores";
  if (actionType === "Weight") cat = "weight";
  else if (actionType === "Feeding") cat = "feeding";
  else if (actionType === "Shed" || actionType.startsWith("Shed:")) cat = "shed";

  const handleCatClick = (newCat: string) => {
    if (newCat === "weight") setActionType("Weight");
    else if (newCat === "feeding") setActionType("Feeding");
    else if (newCat === "shed") {
      if (!actionType.startsWith("Shed:") && actionType !== "Shed") setActionType("Shed: In the Blue");
    } else if (newCat === "chores") {
      if (["Weight", "Feeding", "Shed"].includes(actionType) || actionType.startsWith("Shed:")) setActionType("Water & Clean");
    }
  };

  const submitLog = async () => {
    setIsSaving(true);
    const { data: { user } } = await db.auth.getUser();
    
    // Fetch profile to get display name (fallback to email)
    const { data: profile } = await db.from("user_profiles").select("display_name").eq("id", user?.id).single();
    const loggedBy = profile?.display_name || user?.email || "Unknown";

    const logDateObj = new Date(dateStr || Date.now());
    
    const payload = { 
      reptile_id: reptile.id, 
      reptile_name: reptile.name, 
      activity_type: actionType, 
      logged_by: loggedBy, 
      activity_date: logDateObj.toISOString(), 
      value_numeric: (cat === 'weight' && weight) ? parseFloat(weight) : null, 
      prey_weight_g: (cat === 'feeding' && preyWeight) ? parseFloat(preyWeight) : null, 
      notes: notes.trim() || null, 
      owner_id: user?.id || null 
    };

    await db.from('activity_logs').insert([payload]);
    
    if (actionType === 'Feeding') {
      await db.from('reptiles').update({ last_fed: logDateObj.toISOString().slice(0, 10) }).eq('id', reptile.id);
    } else if (actionType === 'Weight' && weight) {
      await db.from('reptiles').update({ current_weight_g: parseFloat(weight) }).eq('id', reptile.id);
    }
    
    onLogAdded(); // Refresh data on the main page
    onClose();    // Close the modal
  };

  const catStyles: any = {
    weight: 'bg-emerald-500/20 border-emerald-500 text-emerald-300',
    feeding: 'bg-amber-500/20 border-amber-500 text-amber-300',
    shed: 'bg-purple-500/20 border-purple-500 text-purple-300',
    chores: 'bg-sky-500/20 border-sky-500 text-sky-300'
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center sm:items-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-3.5 shadow-2xl">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-white">{actionType} — {reptile.name}</h3>
          <button onClick={onClose} className="text-slate-400 text-2xl font-bold hover:text-white">&times;</button>
        </div>
        
        {/* Step 1: Primary Category */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">1. Select Care Category</label>
          <div className="grid grid-cols-4 gap-1.5">
            <button onClick={() => handleCatClick('weight')} className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition flex flex-col items-center gap-0.5 ${cat === 'weight' ? catStyles.weight : 'bg-slate-950 border-slate-800 text-slate-400'}`}><span className="text-base">⚖️</span><span>Weight</span></button>
            <button onClick={() => handleCatClick('feeding')} className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition flex flex-col items-center gap-0.5 ${cat === 'feeding' ? catStyles.feeding : 'bg-slate-950 border-slate-800 text-slate-400'}`}><span className="text-base">🐁</span><span>Feeding</span></button>
            <button onClick={() => handleCatClick('shed')} className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition flex flex-col items-center gap-0.5 ${cat === 'shed' ? catStyles.shed : 'bg-slate-950 border-slate-800 text-slate-400'}`}><span className="text-base">🐍</span><span>Shed</span></button>
            <button onClick={() => handleCatClick('chores')} className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition flex flex-col items-center gap-0.5 ${cat === 'chores' ? catStyles.chores : 'bg-slate-950 border-slate-800 text-slate-400'}`}><span className="text-base">🧹</span><span>Chores</span></button>
          </div>
        </div>

        {cat === 'feeding' && rules.isSnake && (
          <div className="bg-emerald-950/50 border border-emerald-500/30 rounded-xl p-2.5 text-xs text-emerald-200">
            <span dangerouslySetInnerHTML={{ __html: `🎯 ${rules.summary}` }} />
          </div>
        )}

        {/* Step 2: Sub-Task Selector for Shed */}
        {cat === 'shed' && (
          <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-purple-500/30">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-purple-300">2. Select Shed Stage</label>
            <div className="grid grid-cols-3 gap-1.5">
              <button onClick={() => setActionType('Shed: In the Blue')} className={`py-2 px-2 rounded-lg text-[11px] font-bold border transition ${actionType === 'Shed: In the Blue' ? 'bg-purple-500 text-slate-950 border-purple-400' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>🔵 In the Blue</button>
              <button onClick={() => setActionType('Shed: Out of the Blue')} className={`py-2 px-2 rounded-lg text-[11px] font-bold border transition ${actionType === 'Shed: Out of the Blue' ? 'bg-purple-500 text-slate-950 border-purple-400' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>👀 Out of Blue</button>
              <button onClick={() => setActionType('Shed: Shed Complete')} className={`py-2 px-2 rounded-lg text-[11px] font-bold border transition ${actionType === 'Shed: Shed Complete' || actionType === 'Shed' ? 'bg-purple-500 text-slate-950 border-purple-400' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>✅ Complete</button>
            </div>
          </div>
        )}

        {/* Step 2: Sub-Task Selector for Chores */}
        {cat === 'chores' && (
          <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-sky-500/30">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-sky-300">2. Select Chore or Milestone</label>
            <div className="grid grid-cols-2 gap-1.5">
              {['Water & Clean', 'Misting / Humidity', 'Substrate Change', 'Health / Note'].map(t => (
                <button key={t} onClick={() => setActionType(t)} className={`py-2 px-2.5 rounded-lg text-xs font-bold border text-left transition ${actionType === t ? 'bg-sky-500 text-slate-950 border-sky-400' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>{t}</button>
              ))}
              {(reptile.is_breeder || reptile.breeder_mode) && ['Lock / Pairing', 'Palpation / Follicles', 'Pre-Ovulation Shed', 'Ovulation', 'Post-Ovulation Shed'].map(t => (
                <button key={t} onClick={() => setActionType(t)} className={`py-2 px-2.5 rounded-lg text-xs font-bold border text-left transition ${actionType === t ? 'bg-sky-500 text-slate-950 border-sky-400' : 'bg-slate-900 border-slate-800 text-purple-300'}`}>{t}</button>
              ))}
            </div>
          </div>
        )}

        {/* Inputs */}
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Date & Time</label>
          <input type="datetime-local" value={dateStr} onChange={e => setDateStr(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500" />
        </div>

        {cat === 'weight' && (
          <div><label className="block text-[11px] text-slate-400 mb-1">Animal Body Weight (g)</label><input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g., 134" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" /></div>
        )}
        
        {cat === 'feeding' && rules.isSnake && (
          <div><label className="block text-[11px] text-slate-400 mb-1">Prey Weight (g)</label><input type="number" step="0.1" value={preyWeight} onChange={e => setPreyWeight(e.target.value)} placeholder="Optional: e.g., 18" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" /></div>
        )}

        <div><label className="block text-[11px] text-slate-400 mb-1">Notes / Details</label><input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g., F/T mouse, complete shed in one piece..." className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" /></div>

        <button onClick={submitLog} disabled={isSaving} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl text-sm transition mt-2">
          {isSaving ? "Saving..." : "Save Log"}
        </button>
      </div>
    </div>
  );
}