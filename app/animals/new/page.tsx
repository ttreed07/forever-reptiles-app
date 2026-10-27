"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/supabase";

export default function AddAnimal() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    species: "Boa Constrictor (BCI)",
    morph: "",
    sex: "Unknown",
    birth_date: "",
    current_weight_g: "",
    is_breeder: false,
    photo_url: ""
  });

  const speciesOptions = [
    "Boa Constrictor (BCI)", 
    "Dumeril's Boa", 
    "Corn Snake", 
    "Leopard Gecko", 
    "Bearded Dragon",
    "Ball Python",
    "Other"
  ];

  const handleSave = async (e: any) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    const { data: { user } } = await db.auth.getUser();
    if (!user) {
      setError("You must be logged in to add an animal.");
      setIsSaving(false);
      return;
    }

    const payload = {
      owner_id: user.id,
      name: formData.name,
      species: formData.species,
      morph: formData.morph || null,
      sex: formData.sex !== "Unknown" ? formData.sex : null,
      birth_date: formData.birth_date || null,
      current_weight_g: formData.current_weight_g ? parseFloat(formData.current_weight_g) : null,
      is_breeder: formData.is_breeder,
      photo_url: formData.photo_url || null,
      last_fed: null
    };

    const { data, error: insertError } = await db.from("reptiles").insert([payload]).select().single();

    if (insertError) {
      setError(insertError.message);
      setIsSaving(false);
    } else if (data) {
      router.push(`/animals/${data.id}`);
    }
  };

  return (
    <main className="p-4 max-w-xl mx-auto pb-24">
      <button onClick={() => router.push('/')} className="text-emerald-400 text-xs font-bold mb-4 hover:underline">
        &larr; Cancel & Return
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h1 className="text-xl font-bold text-white mb-1">Add New Animal</h1>
        <p className="text-xs text-slate-400 mb-6">Enter details to generate smart husbandry guidelines.</p>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Name / ID *</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" placeholder="e.g., Clyde" />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Species *</label>
              <select value={formData.species} onChange={e => setFormData({...formData, species: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 appearance-none">
                {speciesOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sex</label>
              <select value={formData.sex} onChange={e => setFormData({...formData, sex: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 appearance-none">
                <option value="Unknown">Unknown / Unsexed</option>
                <option value="M">Male (M)</option>
                <option value="F">Female (F)</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Morph / Genetics</label>
              <input type="text" value={formData.morph} onChange={e => setFormData({...formData, morph: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" placeholder="e.g., Hypo IMG Double Het Kahl Snow" />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Birth Date / Approx Date</label>
              <input type="date" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Weight (g)</label>
              <input type="number" step="0.1" value={formData.current_weight_g} onChange={e => setFormData({...formData, current_weight_g: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" placeholder="e.g., 145" />
            </div>
            
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cover Photo URL</label>
              <input type="url" value={formData.photo_url} onChange={e => setFormData({...formData, photo_url: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" placeholder="https://..." />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 mt-4">
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-purple-500/50 transition">
              <input type="checkbox" checked={formData.is_breeder} onChange={e => setFormData({...formData, is_breeder: e.target.checked})} className="w-5 h-5 accent-purple-500" />
              <div>
                <p className="text-sm font-bold text-purple-300">Mark as Breeder</p>
                <p className="text-[10px] text-slate-400">Unlocks pairing, ovulation, and follicle tracking logs.</p>
              </div>
            </label>
          </div>

          {error && <div className="text-red-400 text-xs font-bold bg-red-950/30 border border-red-900 rounded-xl p-3">{error}</div>}

          <button type="submit" disabled={isSaving} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-xl text-sm transition mt-6 shadow-lg shadow-emerald-500/20">
            {isSaving ? "Saving Animal..." : "Add to Collection"}
          </button>
        </form>
      </div>
    </main>
  );
}