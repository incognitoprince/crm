import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Icon } from "../components/Icons";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => { if (user) navigate(user.role === "ADMIN" ? "/dashboard" : "/orders", { replace: true }); }, [user, navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try { await login(username, password, rememberMe); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to sign in"); }
    finally { setSaving(false); }
  }

  const fieldWrap = "group relative flex items-center rounded-2xl border border-white/25 bg-white/10 transition-all duration-300 focus-within:border-white/70 focus-within:bg-white/20 focus-within:shadow-[0_0_0_4px_rgba(255,255,255,0.12)]";
  const fieldInput = "h-12 w-full bg-transparent px-3 text-sm font-medium text-white outline-none placeholder:text-white/50";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#0b2a5b] via-[#1554b8] to-[#59a4ff] p-5">
      {/* animated aurora blobs */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-[420px] w-[420px] animate-blob rounded-full bg-sky-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-[480px] w-[480px] animate-blob rounded-full bg-indigo-500/40 blur-3xl [animation-delay:-5s]" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[300px] w-[300px] animate-blob rounded-full bg-cyan-300/25 blur-3xl [animation-delay:-9s]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:26px_26px]" />

      <div className="relative w-full max-w-[420px] animate-fade-up">
        <div className="rounded-[28px] border border-white/25 bg-white/[0.12] p-8 shadow-[0_30px_80px_-20px_rgba(4,20,60,0.65)] backdrop-blur-2xl sm:p-10">
          <div className="flex flex-col items-center text-center">
            <div className="relative animate-float">
              <span className="absolute inset-0 animate-pulse-ring rounded-full" />
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/30 bg-gradient-to-br from-white/30 to-white/5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_12px_30px_-8px_rgba(4,20,60,0.6)]">
                <Icon name="scissors" className="h-9 w-9" />
              </div>
            </div>
            <h1 className="mt-5 text-[13px] font-semibold uppercase tracking-[0.35em] text-white/90">Tailoring CRM</h1>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white">Welcome back</h2>
            <p className="mt-1.5 text-sm text-white/70">Sign in with your username to continue</p>
          </div>

          {error && (
            <div role="alert" className="mt-6 animate-scale-in rounded-2xl border border-rose-200/40 bg-rose-500/20 px-4 py-3 text-sm font-medium text-white">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block">
              <span className="sr-only">Username</span>
              <div className={fieldWrap}>
                <Icon name="user" className="ml-4 h-[18px] w-[18px] text-white/70" />
                <input required autoComplete="username" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className={fieldInput} />
              </div>
            </label>
            <label className="block">
              <span className="sr-only">Password</span>
              <div className={fieldWrap}>
                <Icon name="lock" className="ml-4 h-[18px] w-[18px] text-white/70" />
                <input required autoComplete="current-password" type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className={fieldInput} />
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(v => !v)} className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/15 hover:text-white">
                  <Icon name={showPassword ? "eyeOff" : "eye"} className="h-[18px] w-[18px]" />
                </button>
              </div>
            </label>

            <label className="flex cursor-pointer select-none items-center gap-2.5 pt-1 text-sm text-white/80">
              <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="h-4 w-4 rounded border-white/40 bg-white/20 accent-white" />
              Remember me
            </label>

            <button
              disabled={saving}
              className="group relative mt-2 h-12 w-full overflow-hidden rounded-2xl bg-white text-sm font-bold tracking-wide text-brand-800 shadow-[0_14px_30px_-10px_rgba(4,20,60,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-12px_rgba(4,20,60,0.8)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-brand-100/70 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative flex items-center justify-center gap-2">
                {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-300 border-t-brand-800" />}
                {saving ? "Signing in…" : "Sign in"}
              </span>
            </button>
          </form>
        </div>
        <p className="mt-5 text-center text-xs text-white/60">Secure workspace for your tailoring business</p>
      </div>
    </div>
  );
}
