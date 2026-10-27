"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../../lib/supabase";

export default function EditAnimal() {
  const params = useParams();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "", species: "Boa Constrictor (BCI)", morph: "", sex: "Unknown",
    birth_date: "", current_weight_g: "", is_breeder: false, photo_url: ""
  });

  const speciesOptions = [
    "Boa Constrictor (BCI)", "Dumeril's Boa", "Corn Snake", 
    "Leopard Gecko", "Bearded Dragon", "Ball Python", "Other"
  ];

  useEffect(() => {
    async function fetchAnimal() {
      const { data } = await db.from("reptiles").select("*").eq("id", params.id).single();
      if (data) {
        setFormData({
          name: data.name || "",
          species: data.species || "Boa Constrictor (BCI)",
          morph: data.morph || "",
          sex: data.sex || "Unknown",
          birth_date: data.birth_date || "",
          current_weight_g: data.current_weight_g ? data.current_weight_g.toString() : "",
          is_breeder: data.is_breeder || false,
          photo_url: data.photo_url || ""
        });
      }
      setIsLoading(false);
    }
    fetchAnimal();
  }, [params.id]);

  const handleUpdate = async (e: any) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    const payload = {
      name: formData.name,
      species: formData.species,
      morph: formData.morph || null,
      sex: formData.sex !== "Unknown" ? formData.sex : null,
      birth_date: formData.birth_date || null,
      current_weight_g: formData.current_weight_g ? parseFloat(formData.current_weight_g) : null,
      is_breeder: formData.is_breeder,
      photo_url: formData.photo_url || null,
    };

    const { error: updateError } = await db.from("reptiles").update(payload).eq("id", params.id);

    if (updateError) {
      setError(updateError.message);
      setIsSaving(false);
    } else {
      router.push(`/animals/${params.id}`);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you absolutely sure you want to delete ${formData.name}? This will also delete all their logs and history. This cannot be undone.`)) {
      setIsSaving(true);
      await db.from("reptiles").delete().eq("id", params.id);
      router.push("/");
    }
  };

  if (isLoading) return <div className="p-6 text-slate-400 text-center mt-10 animate-pulse">Loading profile data...</div>;

  return (
    <main className="p-4 max-w-xl mx-auto pb-24">
      <button onClick={() => router.push(`/animals/${params.id}`)} className="text-emerald-400 text-xs font-bold mb-4 hover:underline">
        &larr; Cancel & Return to Profile
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h1 className="text-xl font-bold text-white mb-1">Edit {formData.name}</h1>
        <p className="text-xs text-slate-400 mb-6">Update details or photos for this animal.</p>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Name / ID *</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
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
              <input type="text" value={formData.morph} onChange={e => setFormData({...formData, morph: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Birth Date / Approx Date</label>
              <input type="date" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Weight (g)</label>
              <input type="number" step="0.1" value={formData.current_weight_g} onChange={e => setFormData({...formData, current_weight_g: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cover Photo URL</label>
              <input type="url" value={formData.photo_url} onChange={e => setFormData({...formData, photo_url: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
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

          <div className="grid grid-cols-3 gap-2 mt-6">
            <button type="button" onClick={handleDelete} className="col-span-1 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 font-bold py-3.5 rounded-xl text-xs transition">
              Delete
            </button>
            <button type="submit" disabled={isSaving} className="col-span-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-xl text-sm transition shadow-lg shadow-emerald-500/20">
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}