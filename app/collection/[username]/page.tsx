"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { db } from "../../../lib/supabase";

export default function PublicCollection() {
  const params = useParams();
  const [reptiles, setReptiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPublicCollection() {
      // Decode the username to handle any weird URL formatting
      const username = decodeURIComponent(params.username as string).toLowerCase();

      const { data, error } = await db
        .from("reptiles")
        .select("id, name, species, morph, photo_url, breeder_mode")
        .eq("is_public", true)
        .eq("owner_username", username)
        .order("name");
      
      if (data) setReptiles(data);
      setIsLoading(false);
    }
    fetchPublicCollection();
  }, [params.username]);

  if (isLoading) return <div className="p-6 text-slate-400 text-center mt-10 animate-pulse">Loading showcase...</div>;

  return (
    <main className="p-6 max-w-5xl mx-auto space-y-6 pb-24">
      <div className="text-center space-y-2 mb-8 mt-4">
        <h1 className="text-3xl font-bold text-white tracking-tight capitalize">{decodeURIComponent(params.username as string)}'s Collection</h1>
        <p className="text-sm text-slate-400">View active breeders, holdbacks, and bioactive enclosures.</p>
      </div>

      {reptiles.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 rounded-2xl border border-slate-800 shadow-lg">
          <span className="text-4xl block mb-2">🐍</span>
          <p className="text-slate-400 text-sm">No public animals available for this breeder.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {reptiles.map(reptile => (
            <Link href={`/collection/${params.username}/${reptile.id}`} key={reptile.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg group block">
              <div className="aspect-square bg-slate-950 relative overflow-hidden">
                {reptile.photo_url ? (
                  <img src={reptile.photo_url} alt={reptile.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">🐍</div>
                )}
                {reptile.breeder_mode && (
                   <span className="absolute top-2 right-2 bg-amber-500/95 text-slate-950 font-bold px-2 py-1 rounded-md text-[10px] shadow-lg">🔥 Ready</span>
                )}
              </div>
              <div className="p-4">
                <h2 className="text-lg font-bold text-white">{reptile.name}</h2>
                <p className="text-xs font-semibold text-emerald-400 mt-1">{reptile.species}</p>
                <p className="text-xs text-slate-400 mt-1">{reptile.morph || 'Normal'}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}