"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "../lib/supabase";
import { getHusbandryRules, formatAge, daysAgo } from "../lib/husbandry";
import Auth from "../components/Auth";
import Header from "../components/Header";

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [members, setMembers] = useState<string[]>([]);
  
  const [reptiles, setReptiles] = useState<any[]>([]);
  const [speciesRules, setSpeciesRules] = useState<any[]>([]);
  const [userSpeciesPrefs, setUserSpeciesPrefs] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [filterSpecies, setFilterSpecies] = useState("All");

  useEffect(() => {
    db.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = db.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function loadDashboardData() {
      if (!session) {
        setLoading(false);
        return;
      }
      setLoading(true);
      
      const [profRes, memRes, repRes, rulesRes, prefRes] = await Promise.all([
        db.from("user_profiles").select("*").eq("id", session.user.id).single(),
        db.from("account_members").select("*").order("created_at"),
        db.from("reptiles").select("*").order("name"),
        db.from("species_husbandry_rules").select("*"),
        db.from("user_species_preferences").select("*")
      ]);
      
      if (profRes.data) setProfile(profRes.data);
      if (memRes.data && memRes.data.length > 0) {
        setMembers(memRes.data.map((m: any) => m.name));
      } else {
        setMembers(["Trevor", "Hannah", "Oakley", "Bryce", "Adeline"]);
      }
      
      if (repRes.data) setReptiles(repRes.data);
      if (rulesRes.data) setSpeciesRules(rulesRes.data);
      if (prefRes.data) setUserSpeciesPrefs(prefRes.data);
      
      setLoading(false);
    }
    loadDashboardData();
  }, [session]);

  if (!session) return <Auth />;

  const uniqueSpecies = Array.from(new Set(reptiles.map(r => r.species))).filter(Boolean);

  const filteredReptiles = reptiles
    .filter(r => {
      const matchesSearch = (r.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (r.morph || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSpecies = filterSpecies === "All" || r.species === filterSpecies;
      return matchesSearch && matchesSpecies;
    })
    .sort((a, b) => {
      if (sortBy === "name") return (a.name || '').localeCompare(b.name || '');
      if (sortBy === "weight") return (b.current_weight_g || 0) - (a.current_weight_g || 0);
      if (sortBy === "upcoming") {
        const rulesA = getHusbandryRules(a, speciesRules, userSpeciesPrefs);
        const rulesB = getHusbandryRules(b, speciesRules, userSpeciesPrefs);
        const dA = daysAgo(a.last_fed) ?? 999;
        const dB = daysAgo(b.last_fed) ?? 999;
        return (rulesA.feedDays - dA) - (rulesB.feedDays - dB);
      }
      return 0;
    });

  return (
    <>
      <Header 
        loading={loading} 
        isMaster={profile?.role === 'master'} 
        activeUser={members[0] || "Trevor"} 
        members={members} 
      />

      {/* Changed max-w-2xl to max-w-7xl to fill desktop screens */}
      <main className="p-4 space-y-5 max-w-7xl mx-auto pb-24">
        
        {/* 3-Tab Main Navigation - Restricted to max-w-2xl so it doesn't stretch too wide */}
        <div className="grid grid-cols-3 bg-slate-900 p-1 rounded-2xl border border-slate-800 max-w-2xl mx-auto shadow-md">
          <div className="py-2.5 rounded-xl text-xs font-extrabold bg-emerald-500 text-slate-950 flex items-center justify-center gap-1.5 transition">
            🐍 Collection
          </div>
          <Link href="/husbandry" className="py-2.5 rounded-xl text-xs font-extrabold text-slate-400 text-center hover:text-white transition">
            📋 Husbandry
          </Link>
          <Link href="/analytics" className="py-2.5 rounded-xl text-xs font-extrabold text-slate-400 text-center hover:text-white transition">
            📈 Analytics
          </Link>
        </div>
        
        <section className="space-y-4">
          <div className="flex justify-between items-center max-w-4xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">My Collection</p>
            <Link href="/animals/new" className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition shadow">
              + Add Animal
            </Link>
          </div>

          {/* Search and Filter Bar - Restricted to max-w-4xl so it doesn't look stretched */}
          {!loading && reptiles.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row gap-2 shadow-sm max-w-4xl mx-auto">
              <input 
                type="text" 
                placeholder="Search names or morphs..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <div className="flex gap-2">
                <select 
                  value={filterSpecies} 
                  onChange={e => setFilterSpecies(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="All">All Species</option>
                  {uniqueSpecies.map((s: any) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select 
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="name">Sort: A-Z</option>
                  <option value="upcoming">Sort: Feed Due</option>
                  <option value="weight">Sort: Heaviest</option>
                </select>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center text-slate-500 text-sm py-12">Syncing with database...</div>
          ) : reptiles.length === 0 ? (
            <div className="text-center text-slate-500 text-sm py-12 border border-dashed border-slate-800 rounded-2xl max-w-4xl mx-auto">
              No animals found. Add one to get started!
            </div>
          ) : (
            // Dynamic Grid: 2 columns on phone, 3 on tablet, 4 on small desktop, 5 on widescreen
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-4">
              {filteredReptiles.map((r) => {
                const rules = getHusbandryRules(r, speciesRules, userSpeciesPrefs);
                const d = daysAgo(r.last_fed);
                
                let statusText = 'No Feed Logged', badgeCls = 'bg-amber-500/90 text-slate-950 border-amber-400';
                
                if (r.alerts_muted) {
                  statusText = '🔕 Alerts Muted';
                  badgeCls = 'bg-slate-800/95 text-slate-400 border-slate-700';
                } else if (d !== null) {
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
                        {r.breeder_mode && <span className="bg-amber-500/95 text-slate-950 font-bold px-1.5 py-0.5 rounded text-[9px] shadow-lg">🔥 Ready</span>}
                        {r.is_breeder && !r.breeder_mode && <span className="bg-purple-500/90 text-slate-950 font-bold px-1.5 py-0.5 rounded text-[9px] shadow-lg">⚤ Breeder</span>}
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold backdrop-blur-md shadow ${badgeCls}`}>{statusText}</span>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-3 pt-12">
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
    </>
  );
}