import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { PageHeader, Panel, Empty } from "@/components/UI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Search, Copy } from "lucide-react";

export default function Employees() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const ru = lang === "ru";
  const [items, setItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ role: "employee" });
  const [q, setQ] = useState("");

  const load = () => api.get("/employees").then((r) => setItems(r.data));
  const loadD = () => api.get("/departments").then((r) => setDepartments(r.data));
  useEffect(() => { load(); loadD(); }, []);

  const create = async () => {
    try {
      await api.post("/auth/register", form);
      toast.success(ru ? "Сотрудник добавлен" : "Employee added");
      setOpen(false); setForm({ role: "employee" }); load();
    } catch (e) { toast.error(e.response?.data?.detail || "Ошибка"); }
  };
  const del = async (id) => {
    if (!window.confirm(ru ? "Удалить сотрудника?" : "Delete employee?")) return;
    try { await api.delete(`/employees/${id}`); load(); toast.success(ru ? "Удалено" : "Deleted"); }
    catch (e) { toast.error(e.response?.data?.detail || "Ошибка"); }
  };

  const isAdmin = user?.role === "admin";
  const filtered = items.filter((it) => !q || JSON.stringify(it).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="pt-4">
      <PageHeader
        testId="employees-header"
        eyebrow="HR & Access"
        title={t("employees")}
        subtitle={ru ? "Персонал с уникальными UID для карт доступа" : "Staff with unique UIDs for access cards"}
        actions={
          <div className="flex items-center gap-2">
            <div className="glass rounded-full px-3 py-1.5 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-white/40" />
              <input value={q} onChange={(e) => setQ(e.target.value)} data-testid="employees-search" placeholder={t("search")} className="bg-transparent outline-none text-xs w-40 placeholder:text-white/30" />
            </div>
            {isAdmin && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="employees-add-btn" className="rounded-full bg-[#FF5722] hover:bg-[#FF6E40] h-9 px-4">
                    <Plus className="w-4 h-4 mr-1" /> {t("add")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-strong border-white/10 rounded-3xl max-w-2xl">
                  <DialogHeader><DialogTitle className="font-heading text-xl">{ru ? "Новый сотрудник" : "New employee"}</DialogTitle></DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label className="text-xs uppercase tracking-[0.15em] text-white/50">{t("full_name")}</Label>
                      <Input value={form.full_name || ""} onChange={(e) => setForm({...form, full_name: e.target.value})} className="bg-black/30 border-white/10 rounded-xl" data-testid="employees-fullname" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-[0.15em] text-white/50">{t("username")}</Label>
                      <Input value={form.username || ""} onChange={(e) => setForm({...form, username: e.target.value})} className="bg-black/30 border-white/10 rounded-xl" data-testid="employees-username" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-[0.15em] text-white/50">{t("password")}</Label>
                      <Input type="password" value={form.password || ""} onChange={(e) => setForm({...form, password: e.target.value})} className="bg-black/30 border-white/10 rounded-xl" data-testid="employees-password" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-[0.15em] text-white/50">Email</Label>
                      <Input value={form.email || ""} onChange={(e) => setForm({...form, email: e.target.value})} className="bg-black/30 border-white/10 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-[0.15em] text-white/50">{t("role")}</Label>
                      <Select value={form.role} onValueChange={(v) => setForm({...form, role: v})}>
                        <SelectTrigger className="bg-black/30 border-white/10 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent className="glass-strong border-white/10">
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="employee">Employee</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label className="text-xs uppercase tracking-[0.15em] text-white/50">{t("department")}</Label>
                      <Select value={form.department_id || ""} onValueChange={(v) => setForm({...form, department_id: v})}>
                        <SelectTrigger className="bg-black/30 border-white/10 rounded-xl"><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent className="glass-strong border-white/10">
                          {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-full">{t("cancel")}</Button>
                    <Button data-testid="employees-save-btn" onClick={create} className="rounded-full bg-[#FF5722] hover:bg-[#FF6E40]">{t("save")}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        }
      />

      {filtered.length === 0 ? <Panel><Empty /></Panel> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="employees-grid">
          {filtered.map((e) => {
            const dept = departments.find((d) => d.id === e.department_id);
            return (
              <div key={e.id} className="glass rounded-3xl p-5 group transition-colors" data-testid={`employee-${e.id}`}>
                <div className="flex items-start gap-3">
                  <Avatar className="w-14 h-14 ring-2 ring-white/10">
                    <AvatarImage src={e.avatar_url} />
                    <AvatarFallback className="bg-black/40 text-white font-heading">{(e.full_name || e.username || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="font-heading font-bold text-base truncate">{e.full_name || e.username}</div>
                    <div className="text-[11px] text-white/50">{e.position || "—"}</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[9px] uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-full bg-[#FF5722]/15 text-[#FF5722]">{e.role}</span>
                      {dept && <span className="text-[9px] uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-full" style={{backgroundColor: (dept.color || "#4F46E5") + "22", color: dept.color || "#A0A5B5"}}>{dept.name}</span>}
                    </div>
                  </div>
                  {isAdmin && e.id !== user?.id && (
                    <button onClick={() => del(e.id)} data-testid={`employees-del-${e.id}`} className="p-1.5 rounded-lg text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="mt-4 p-3 rounded-xl bg-black/30 border border-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[9px] uppercase tracking-[0.2em] text-white/40">{t("access_uid")}</div>
                      <div className="mono text-sm text-[#E1FF00] mt-1">{e.access_uid}</div>
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(e.access_uid); toast.success("UID скопирован"); }} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-white/40 space-y-1">
                  <div className="truncate">@{e.username}</div>
                  <div className="truncate">{e.email || "—"}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
