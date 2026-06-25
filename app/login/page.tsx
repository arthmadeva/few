"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Admin Cabang");
  const [cabang, setCabang] = useState("Bandung");
  const [customCabang, setCustomCabang] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const branches = ["Bandung", "Jakarta", "Yogyakarta", "Surabaya", "Medan", "Lainnya"];

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const finalCabang = cabang === "Lainnya" ? customCabang : cabang;

    if (isSignUp && !finalCabang && (role === "Admin Cabang" || role === "Layanan Konsumen / CS")) {
      setErrorMsg("Nama cabang wajib diisi untuk peran ini!");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role,
              cabang: ["Admin Cabang", "Layanan Konsumen / CS"].includes(role) ? finalCabang : "Semua",
            },
          },
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (data.user && data.session === null) {
          // If confirmation is required (email verification)
          setSuccessMsg("Pendaftaran berhasil! Silakan periksa email Anda untuk memverifikasi akun.");
        } else {
          setSuccessMsg("Pendaftaran berhasil! Mengalihkan...");
          setTimeout(() => {
            router.refresh();
            router.push("/");
          }, 1500);
        }
      } else {
        // Sign In
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg("Login berhasil! Mengalihkan...");
          setTimeout(() => {
            router.refresh();
            router.push("/");
          }, 1000);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan yang tidak terduga.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 via-zinc-950 to-black p-4 relative overflow-hidden">
      {/* Decorative blurred backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-lg backdrop-blur-xl bg-zinc-900/60 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 p-8 z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 text-white font-bold text-2xl mb-4">
            AK
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Akur Optic 55
          </h1>
          <p className="text-zinc-400 text-sm mt-2">
            Integrasi Spreadsheet "Collect Data"
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3.5 mb-6 flex items-start space-x-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-lg p-3.5 mb-6 flex items-start space-x-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-indigo-500 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-indigo-500 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {isSignUp && (
            <div className="space-y-5 p-4 border border-zinc-800/80 rounded-xl bg-zinc-950/30">
              <div>
                <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2" htmlFor="role">
                  Peran Pengguna (Role)
                </label>
                <select
                  id="role"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="Admin Cabang">Admin Cabang (Edit Regristrasi)</option>
                  <option value="Layanan Konsumen / CS">Layanan Konsumen / CS</option>
                  <option value="Staf Gudang">Staf Gudang (Logistik & Produksi)</option>
                  <option value="Staf Keuangan Manajemen">Staf Keuangan Manajemen (QC & Pengiriman)</option>
                </select>
              </div>

              {["Admin Cabang", "Layanan Konsumen / CS"].includes(role) && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2" htmlFor="cabang">
                      Wilayah Cabang
                    </label>
                    <select
                      id="cabang"
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                      value={cabang}
                      onChange={(e) => setCabang(e.target.value)}
                    >
                      {branches.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  {cabang === "Lainnya" && (
                    <div>
                      <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2" htmlFor="custom-cabang">
                        Nama Cabang Kustom
                      </label>
                      <input
                        id="custom-cabang"
                        type="text"
                        required
                        className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-indigo-500 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                        placeholder="Masukkan nama cabang..."
                        value={customCabang}
                        onChange={(e) => setCustomCabang(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all text-sm flex items-center justify-center space-x-2 mt-4 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Memproses...</span>
              </>
            ) : (
              <span>{isSignUp ? "Daftar Akun Baru" : "Masuk ke Sistem"}</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-zinc-800/80 pt-5">
          <button
            type="button"
            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium focus:outline-none transition-colors cursor-pointer"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg("");
              setSuccessMsg("");
            }}
          >
            {isSignUp ? "Sudah punya akun? Masuk di sini" : "Belum punya akun? Daftar di sini"}
          </button>
        </div>
      </div>
    </div>
  );
}
