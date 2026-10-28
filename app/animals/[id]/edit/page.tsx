"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "../../../../lib/supabase";

export default function EditAnimalProfile() {
  const params = useParams();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [form, setForm] = useState({
    name: "",
    species: "Boa Imperator",
    morph: "",
    photo_url: "",
    gallery_urls: [] as string[],
    is_breeder: false,
    breeder_mode: false
  });

  // File Upload State
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<FileList | null>(null);

  useEffect(() => {
    async function fetchReptile() {
      const { data } = await db.from("reptiles").select("*").eq("id", params.id).single();
      if (data) {
        setForm({
          name: data.name || "",
          species: data.species || "Boa Imperator",
          morph: data.morph || "",
          photo_url: data.photo_url || "",
          gallery_urls: data.gallery_urls || [],
          is_breeder: data.is_breeder || false,
          breeder_mode: data.breeder_mode || false
        });
      }
      setIsLoading(false);
    }
    fetchReptile();
  }, [params.id]);

  // Built-in Client-Side Compressor to save Supabase Storage
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1200; // Cap width to 1200px
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: "image/jpeg" }));
            } else {
              resolve(file); // Fallback if compression fails
            }
          }, "image/jpeg", 0.7); // 70% quality JPEG
        };
      };
    });
  };

  const handleFileUpload = async (file: File) => {
    const compressedFile = await compressImage(file);
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    
    const { error } = await db.storage.from("reptiles").upload(fileName, compressedFile);
    if (error) throw error;
    
    const { data: pubData } = db.storage.from("reptiles").getPublicUrl(fileName);
    return pubData.publicUrl;
  };

  const removeGalleryImage = (indexToRemove: number) => {
    setForm(prev => ({
      ...prev,
      gallery_urls: prev.gallery_urls.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let finalAvatarUrl = form.photo_url;
      if (avatarFile) {
        finalAvatarUrl = await handleFileUpload(avatarFile);
      }

      let newGalleryUrls = [...form.gallery_urls];
      if (galleryFiles) {
        for (let i = 0; i < galleryFiles.length; i++) {
          const url = await handleFileUpload(galleryFiles[i]);
          newGalleryUrls.push(url);
        }
      }

      await db.from("reptiles").update({
        name: form.name,
        species: form.species,
        morph: form.morph,
        photo_url: finalAvatarUrl,
        gallery_urls: newGalleryUrls,
        is_breeder: form.is_breeder,
        breeder_mode: form.breeder_mode
      }).eq("id", params.id);

      router.push(`/animals/${params.id}`);
      router.refresh();
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save. Check console for details.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-6 text-slate-400 text-center mt-10 animate-pulse">Loading editor...</div>;

  return (
    <main className="p-4 max-w-xl mx-auto pb-24 space-y-6">
      <Link href={`/animals/${params.id}`} className="text-emerald-400 text-xs font-bold hover:underline">
        &larr; Cancel and Return to Profile
      </Link>
      
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
        <div>
          <h1 className="text-xl font-bold text-white">Edit Profile: {form.name}</h1>
          <p className="text-xs text-slate-400">Update identification, genetics, and gallery media.</p>
        </div>

        {/* Basic Info */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Animal Name</label>
            <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Species</label>
              <select value={form.species} onChange={e => setForm({...form, species: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none">
                <option value="Boa Imperator">Boa Imperator</option>
                <option value="Dumerils Boa">Dumeril's Boa</option>
                <option value="Corn Snake">Corn Snake</option>
                <option value="Leopard Gecko">Leopard Gecko</option>
                <option value="Bearded Dragon">Bearded Dragon</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Morph / Genetics</label>
              <input type="text" value={form.morph} onChange={e => setForm({...form, morph: e.target.value})} placeholder="e.g. Hypo IMG DH Kahl" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>
        </div>

        {/* Media Section */}
        <div className="pt-4 border-t border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-emerald-400">Media & Photos</h2>
          
          {/* Primary Avatar */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-4">
            {form.photo_url ? (
              <img src={form.photo_url} className="w-16 h-16 rounded-lg object-cover border border-slate-700" alt="Avatar" />
            ) : (
              <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center text-2xl border border-slate-700">🐍</div>
            )}
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-300 mb-1">Primary Profile Avatar</label>
              <input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files?.[0] || null)} className="text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-slate-800 file:text-emerald-400 hover:file:bg-slate-700" />
            </div>
          </div>

          {/* Expanded Gallery */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Add to Photo Gallery (Select Multiple)</label>
              <input type="file" accept="image/*" multiple onChange={e => setGalleryFiles(e.target.files)} className="text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-slate-800 file:text-sky-400 hover:file:bg-slate-700" />
            </div>
            
            {/* Existing Gallery Preview */}
            {form.gallery_urls.length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 block mb-2">Current Gallery Images (Click to Remove)</span>
                <div className="flex flex-wrap gap-2">
                  {form.gallery_urls.map((url, idx) => (
                    <div key={idx} className="relative group cursor-pointer" onClick={() => removeGalleryImage(idx)}>
                      <img src={url} className="w-12 h-12 rounded-md object-cover border border-slate-700 group-hover:opacity-40 transition" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="text-red-500 font-bold text-lg">&times;</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Breeding Toggles */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <h2 className="text-sm font-bold text-purple-400">Breeding Status</h2>
          <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
            <span className="text-xs font-bold text-slate-300">Adult / Established Breeder</span>
            <input type="checkbox" checked={form.is_breeder} onChange={e => setForm({...form, is_breeder: e.target.checked})} className="w-4 h-4 accent-purple-500 rounded bg-slate-800 border-slate-700" />
          </div>
          <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
            <div>
              <span className="text-xs font-bold text-amber-300 block">Active Breeding Mode</span>
              <span className="text-[10px] text-slate-500 block">Enables pairing/lock logs and seasonal tracking</span>
            </div>
            <input type="checkbox" checked={form.breeder_mode} onChange={e => setForm({...form, breeder_mode: e.target.checked})} className="w-4 h-4 accent-amber-500 rounded bg-slate-800 border-slate-700" />
          </div>
        </div>

        <button type="submit" disabled={isSaving} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl text-sm transition mt-4">
          {isSaving ? "Compressing & Saving..." : "Save Animal Profile"}
        </button>
      </form>
    </main>
  );
}