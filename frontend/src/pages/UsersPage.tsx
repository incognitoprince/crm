import { useEffect, useState, type FormEvent } from "react";
import { createUser, deleteUser, getUsers, updateUser, type ManagedUser } from "../services/api";

const roleLabels: Record<ManagedUser["role"], string> = {
  ADMIN: "Admin",
  STAFF: "Staff",
  INVOICE_CREATOR: "Invoice Creator",
};

export function UsersPage(){
 const [users,setUsers]=useState<ManagedUser[]>([]);
 const [form,setForm]=useState({name:"",username:"",password:"",role:"STAFF" as ManagedUser["role"]});
 const [error,setError]=useState(""); const [saving,setSaving]=useState(false); const [resetting,setResetting]=useState("");
 const load=()=>getUsers().then(r=>setUsers(r.data)).catch(e=>setError(e instanceof Error?e.message:"Unable to load users"));
 useEffect(()=>{void load();},[]);
 async function submit(e:FormEvent){e.preventDefault();setSaving(true);setError("");try{await createUser(form);setForm({name:"",username:"",password:"",role:"STAFF"});await load();}catch(e){setError(e instanceof Error?e.message:"Unable to create user");}finally{setSaving(false);}}
 async function remove(u:ManagedUser){if(!window.confirm("Delete user '"+u.username+"'? This cannot be undone."))return;setError("");try{await deleteUser(u.id);await load();}catch(e){setError(e instanceof Error?e.message:"Unable to delete user");}}
 async function toggle(u:ManagedUser){setError("");try{await updateUser(u.id,{active:!u.active});await load();}catch(e){setError(e instanceof Error?e.message:"Unable to update user");}}
 async function resetPassword(u:ManagedUser){
   const password=window.prompt("Enter a new password for "+u.username+" (minimum 12 characters):");
   if(password===null)return;
   if(password.length<12){setError("Password must contain at least 12 characters.");return;}
   setResetting(u.id);setError("");
   try{await updateUser(u.id,{password});await load();}catch(e){setError(e instanceof Error?e.message:"Unable to change password");}finally{setResetting("");}
 }
 return <div className="mx-auto max-w-6xl space-y-5">
  <section><p className="text-xs uppercase tracking-[.18em] text-slate-500">Administration</p><h3 className="mt-1 text-2xl font-semibold text-navy-900">User management</h3><p className="mt-1 text-sm text-slate-600">Create users, assign access once, activate/deactivate accounts, and let admins reset passwords.</p></section>
  {error&&<p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
  <form onSubmit={submit} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-5">
   <input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Name" className="h-11 rounded-md border px-3"/>
   <input required value={form.username} onChange={e=>setForm({...form,username:e.target.value})} placeholder="Username" className="h-11 rounded-md border px-3"/>
   <input required minLength={12} type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Password (12+)" className="h-11 rounded-md border px-3"/>
   <select value={form.role} onChange={e=>setForm({...form,role:e.target.value as ManagedUser["role"]})} className="h-11 rounded-md border px-3">
    <option value="STAFF">Staff</option><option value="INVOICE_CREATOR">Invoice Creator</option><option value="ADMIN">Admin</option>
   </select>
   <button disabled={saving} className="rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white">{saving?"Saving…":"Add"}</button>
  </form>
  <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
   <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm">
    <thead><tr className="border-b border-slate-100 text-left text-xs text-slate-500"><th className="pb-3">Name</th><th className="pb-3">Username</th><th className="pb-3">Access</th><th className="pb-3">Status</th><th className="pb-3">Actions</th></tr></thead>
    <tbody>{users.map(u=><tr key={u.id} className="border-b border-slate-50 last:border-0">
      <td className="py-3 font-medium">{u.name}</td><td className="py-3 font-medium text-slate-700">{u.username}</td>
      <td className="py-3"><span className={"rounded-full px-2.5 py-1 text-xs font-semibold "+(u.role==="ADMIN"?"bg-blue-50 text-blue-700":u.role==="INVOICE_CREATOR"?"bg-violet-50 text-violet-700":"bg-slate-100 text-slate-700")}>{roleLabels[u.role]}</span></td>
      <td className="py-3"><button onClick={()=>void toggle(u)} className={"rounded-full px-2.5 py-1 text-xs font-semibold "+(u.active?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-500")}>{u.active?"Active":"Inactive"}</button></td>
      <td className="py-3"><div className="flex items-center gap-2">
        <button disabled={resetting===u.id} onClick={()=>void resetPassword(u)} className="rounded-md border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 disabled:opacity-50">{resetting===u.id?"Saving…":"Change password"}</button>
        {u.username.toLowerCase()==="admin"?<span className="text-xs font-medium text-slate-400">Protected</span>:<button onClick={()=>void remove(u)} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700">Delete</button>}
      </div></td>
    </tr>)}</tbody>
   </table></div>
  </section>
 </div>;
}
