"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "../../../lib/supabase";
import { getCustomFeeders } from "../../../lib/husbandry";

export default function AddAnimal() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    species: "Boa Constrictor (BCI)",
    sex: "F",
    morph: "",
    birth_date: "",
    current_weight_g: "",
    enclosure_id: "",
    notes: "",
    photo_url: "",
    is_breeder: false,
    breeder_mode: false,
    target_breeding_weight: "",
    routine_tasks_enabled: true,
    use_smart_guidelines: true,
    manual_feeder_override: false,
    custom_feeder_size: ""
  });

  const speciesOptions = [
    "Dumeril's Boa", "Boa Constrictor (BCI)", "True Red Tail Boa (BCC)", 
    "Corn Snake", "Ball Python", "King / Milk Snake", "Western Hognose", 
    "Leopard Gecko", "Bearded Dragon", "Crested Gecko", "Other"
  ];

  const customFeeders = getCustomFeeders();

  const handlePhotoUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev: any) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 720;
        let w = img.width, h = img.height;
        if (w > h && w > max) { h *= max / w; w = max; } 
        else if (h > max) { w *= max / h; h = max; }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
        const url = canvas.toDataURL("image/jpeg", 0.82);
        setFormData(prev => ({ ...prev, photo_url: url }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formData.name.trim()) { setError("Animal name is required."); return; }
    setIsSaving(true);
    setError("");

    const payload = {
      name: formData.name.trim(),
      species: formData.species,
      sex: formData.sex,
      morph: formData.morph.trim() || null,
      birth_date: formData.birth_date || null,
      current_weight_g: formData.current_weight_g ? parseFloat(formData.current_weight_g) : null,
      enclosure_id: formData.enclosure_id.trim() || null,
      notes: formData.notes.trim() || null,
      photo_url: formData.photo_url || null,
      is_breeder: formData.is_breeder,
      breeder_mode: formData.breeder_mode,
      target_breeding_weight: formData.target_breeding_weight ? parseFloat(formData.target_breeding_weight) : null,
      routine_tasks_enabled: formData.routine_tasks_enabled,
      use_smart_guidelines: formData.use_smart_guidelines,
      manual_feeder_override: formData.manual_feeder_override,
      custom_feeder_size: formData.manual_feeder_override ? formData.custom_feeder_size : null,
    };

    const { error: insertError } = await db.from("reptiles").insert([payload]);
    if (insertError) {
      setError(insertError.message);
      setIsSaving(false);
    } else {
      router.push("/");
    }
  };

  return (
    <main className="p-4 max-w-xl mx-auto pb-24">
      <Link href="/" className="text-emerald-400 text-xs font-bold mb-4 inline-block hover:underline">
        &larr; Cancel & Return to Collection
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">Add New Animal</h1>
          <p className="text-xs text-slate-400">Register a new animal into your collection tracker.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Uploader */}
          <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            {formData.photo_url ? (
              <img src={formData.photo_url} alt="Preview" className="w-14 h-14 rounded-xl object-cover border border-slate-700" />
            ) : (
              <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-2xl border border-slate-700">🐍</div>
            )}
            <div className="flex-1">
              <label className="block text-[11px] text-slate-400 mb-1">Cover Photo (Auto-Compressed)</label>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-slate-800 file:text-emerald-400 cursor-pointer" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Name / ID *</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g., Clyde" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Species *</label>
              <select value={formData.species} onChange={e => setFormData({...formData, species: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 appearance-none">
                {speciesOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sex</label>
              <select value={formData.sex} onChange={e => setFormData({...formData, sex: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 appearance-none">
                <option value="F">Female (F)</option>
                <option value="M">Male (M)</option>
                <option value="Unknown">Unknown / Unsexed</option>
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Enclosure</label>
              <input type="text" value={formData.enclosure_id} onChange={e => setFormData({...formData, enclosure_id: e.target.value})} placeholder="e.g., PVC-1" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>

            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Morph / Genetics</label>
              <input type="text" value={formData.morph} onChange={e => setFormData({...formData, morph: e.target.value})} placeholder="e.g., Hypo IMG Het Kahl" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Birth / Hatch Date</label>
              <input type="date" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Weight (g)</label>
              <input type="number" step="0.1" value={formData.current_weight_g} onChange={e => setFormData({...formData, current_weight_g: e.target.value})} placeholder="e.g., 150" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={formData.routine_tasks_enabled} onChange={e => setFormData({...formData, routine_tasks_enabled: e.target.checked})} className="w-4 h-4 accent-sky-500 rounded" />
              <span className="text-xs font-bold text-sky-300">Enable Routine Care Alerts (Water & Misting)</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={formData.use_smart_guidelines} onChange={e => setFormData({...formData, use_smart_guidelines: e.target.checked})} className="w-4 h-4 accent-emerald-500 rounded" />
              <span className="text-xs font-bold text-emerald-300">Enable Scientific Feeding Guidelines</span>
            </label>
            <div className="pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={formData.manual_feeder_override} onChange={e => setFormData({...formData, manual_feeder_override: e.target.checked})} className="w-4 h-4 accent-amber-500 rounded" />
                <span className="text-xs font-bold text-amber-400">🎯 Manual Feeder Size Override</span>
              </label>
              {formData.manual_feeder_override && (
                <div className="mt-2.5">
                  <label className="block text-[10px] text-slate-400 mb-1">Select Target Prey Size</label>
                  <select value={formData.custom_feeder_size} onChange={e => setFormData({...formData, custom_feeder_size: e.target.value})} className="w-full bg-slate-900 border border-amber-500/40 rounded-lg px-3 py-2 text-xs text-white font-semibold">
                    <option value="">-- Choose Feeder Size --</option>
                    {customFeeders.map((f: any) => <option key={f.n} value={f.n}>{f.n} (up to {f.m}g)</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Breeder Toggles */}
          <div className="bg-purple-950/20 border border-purple-500/30 p-3 rounded-xl space-y-3">
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.is_breeder} onChange={e => setFormData({...formData, is_breeder: e.target.checked})} className="w-4 h-4 accent-purple-500 rounded" />
                <span className="text-xs font-bold text-purple-300">Mark as Breeder ⚤</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.breeder_mode} onChange={e => setFormData({...formData, breeder_mode: e.target.checked})} className="w-4 h-4 accent-amber-400 rounded" />
                <span className="text-xs font-bold text-amber-300">Ready to Breed 🔥</span>
              </label>
            </div>
            {(formData.is_breeder || formData.breeder_mode) && (
              <div>
                <label className="block text-[10px] text-purple-300 font-bold mb-1">Target Conditioning / Breeding Weight (g)</label>
                <input type="number" step="1" value={formData.target_breeding_weight} onChange={e => setFormData({...formData, target_breeding_weight: e.target.value})} placeholder="e.g., 2500" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Care Notes</label>
            <textarea rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Temperament, feeding quirks..." className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500" />
          </div>

          {error && <div className="text-red-400 text-xs font-bold bg-red-950/40 border border-red-900 rounded-xl p-3">{error}</div>}

          <button type="submit" disabled={isSaving} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-xl text-sm transition shadow-lg shadow-emerald-500/20">
            {isSaving ? "Saving Animal..." : "Save Animal"}
          </button>
        </form>
      </div>
    </main>
  );
}