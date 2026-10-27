"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "../lib/supabase";
import { getHusbandryRules, formatAge, daysAgo } from "../lib/husbandry";
import Auth from "../components/Auth";

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [reptiles, setReptiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Check for user login
  useEffect(() => {
    db.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = db.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch reptiles ONLY if logged in
  useEffect(() => {
    async function loadCollection() {
      if (!session) {
        setLoading(false);
        return;
      }
      setLoading(true);
      
      const { data, error } = await db.from("reptiles").select("*").order("name");
      
      if (data) setReptiles(data);
      setLoading(false);
    }
    loadCollection();
  }, [session]);

  // 3. Show Login Gate if not authenticated
  if (!session) {
    return <Auth />;
  }

  // 4. Show Main App if authenticated
  return (
    <main className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
      <header className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-emerald-400 tracking-tight">ForeverReptiles</h1>
          <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[11px] text-slate-400">Next.js v2</div>
          <button onClick={() => db.auth.signOut()} className="bg-slate-800 text-slate-400 px-2 py-1.5 rounded-lg border border-slate-700 text-xs">🔒</button>
        </div>
      </header>

      {/* 2-Tab Main Navigation */}
      <div className="grid grid-cols-2 bg-slate-900 p-1 rounded-2xl border border-slate-800 mb-4">
        <div className="py-2.5 rounded-xl text-xs font-extrabold bg-emerald-500 text-slate-950 flex items-center justify-center gap-1.5 transition">
          🐍 Collection
        </div>
        <Link href="/husbandry" className="py-2.5 rounded-xl text-xs font-extrabold text-slate-400 text-center hover:text-white transition">
          📋 Husbandry
        </Link>
      </div>
      
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">My Collection</p>
          <Link href="/animals/new" className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition shadow">
            + Add Animal
          </Link>
        </div>

        {loading ? (
          <div className="text-center text-slate-500 text-sm py-12">Syncing with database...</div>
        ) : reptiles.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-12 border border-dashed border-slate-800 rounded-2xl">
            No animals found. Add one to get started!
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5">
            {reptiles.map((r) => {
              const rules = getHusbandryRules(r);
              const d = daysAgo(r.last_fed);
              
              let statusText = 'No Feed Logged', badgeCls = 'bg-amber-500/90 text-slate-950 border-amber-400';
              if (d !== null) {
                if (d >= rules.feedDays) { statusText = `Due (${d}d ago)`; badgeCls = 'bg-amber-500/95 text-slate-950 border-amber-300'; }
                else if (d >= rules.minWin) { statusText = `Window Open (${d}d ago)`; badgeCls = 'bg-sky-400/95 text-slate-950 border-sky-300'; }
                else { statusText = d === 0 ? 'Fed Today' : `Last fed ${d}d ago`; badgeCls = 'bg-slate-900/85 text-emerald-300 border-emerald-500/40'; }
              }

              const age = formatAge(r.birth_date);

              return (
                <Link href={`/animals/${r.id}`} key={r.id} className="group block bg-slate-900 hover:border-slate-700 border border-slate-800 rounded-2xl overflow-hidden shadow-md transition">
                  <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-800">
                    {r.photo_url ? (
                      <img src={r.photo_url} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center text-slate-600">
                        <span className="text-4xl mb-1">🐍</span>
                      </div>
                    )}
                    <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 flex-wrap justify-end">
                      {r.breeder_mode && <span className="bg-amber-500/95 text-slate-950 font-bold px-1.5 py-0.5 rounded text-[9px]">🔥 Ready</span>}
                      {r.is_breeder && !r.breeder_mode && <span className="bg-purple-500/90 text-slate-950 font-bold px-1.5 py-0.5 rounded text-[9px]">⚤ Breeder</span>}
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold backdrop-blur-md shadow ${badgeCls}`}>{statusText}</span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-3 pt-10">
                      <h3 className="text-base font-extrabold text-white leading-tight drop-shadow truncate">
                        {r.name} <span className="text-xs font-semibold text-slate-300">({r.sex || '?'}{age ? ' • ' + age : ''})</span>
                      </h3>
                      <p className="text-[11px] text-emerald-300 font-medium truncate">{r.morph || r.species}</p>
                    </div>
                  </div>
                  <div className="px-3 py-2 bg-slate-900 flex items-center justify-between gap-1 text-[11px]">
                    <span className="font-bold text-slate-200">{r.current_weight_g ? r.current_weight_g + 'g' : 'No weight'}</span>
                    <span className={`${rules.hasManualOverride ? 'text-amber-300 font-semibold' : 'text-slate-400'} truncate`}>
                      {rules.targetShort ? `🎯 ${rules.targetShort}` : `Win: ${rules.windowLabel}`}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}