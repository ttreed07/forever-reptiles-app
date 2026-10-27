"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "../../../lib/supabase";

export default function ScanHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("Validating cage security token...");

  const animalId = searchParams.get("id");
  const token = searchParams.get("token");

  useEffect(() => {
    async function validateAndBypass() {
      if (!animalId || !token) {
        setStatus("Invalid or incomplete QR code scan.");
        return;
      }

      const { data, error } = await db
        .from("reptiles")
        .select("id, qr_token")
        .eq("id", animalId)
        .single();

      if (error || !data || data.qr_token !== token) {
        setStatus("Security check failed: Unauthorized or expired cage tag.");
        return;
      }

      localStorage.setItem(`fr_scan_auth_${animalId}`, "true");
      router.replace(`/animals/${animalId}`);
    }

    validateAndBypass();
  }, [animalId, token, router]);

  return (
    <main className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3 max-w-sm shadow-xl">
        <span className="text-3xl">🐍</span>
        <h2 className="text-sm font-bold text-white">ForeverReptiles Cage Scanner</h2>
        <p className="text-xs text-slate-400">{status}</p>
      </div>
    </main>
  );
}