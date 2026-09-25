import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
export function LoginPage() {
 const navigate=useNavigate(); const {login,user}=useAuth(); const [username,setUsername]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [saving,setSaving]=useState(false);
 useEffect(()=>{if(user) navigate(user.role==="ADMIN"?"/dashboard":"/orders",{replace:true});},[user,navigate]);
 async function submit(e:FormEvent){e.preventDefault();setSaving(true);setError("");try{await login(username,password);}catch(e){setError(e instanceof Error?e.message:"Unable to sign in");}finally{setSaving(false);}}
 return <div className="min-h-screen bg-[#f5f9fd] flex items-center justify-center p-5"><div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_18px_50px_rgba(15,31,53,.10)]">
 <div className="mb-7 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-2xl text-white">✂</div><div><h1 className="text-2xl font-bold text-navy-900">Tailoring CRM</h1><p className="text-sm text-slate-500">Tailor shop management</p></div></div>
 <h2 className="text-xl font-semibold text-navy-900">Sign in</h2><p className="mt-1 text-sm text-slate-500">Use your username to access the application.</p>{error&&<div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
 <form onSubmit={submit} className="mt-5 space-y-4"><label className="block text-sm font-medium text-slate-700">Username<input required value={username} onChange={e=>setUsername(e.target.value)} className="mt-1 h-11 w-full rounded-lg border px-3" /></label><label className="block text-sm font-medium text-slate-700">Password<input required type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 h-11 w-full rounded-lg border px-3" /></label><button disabled={saving} className="h-11 w-full rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{saving?"Signing in…":"Sign in"}</button></form>
 </div></div>;
}