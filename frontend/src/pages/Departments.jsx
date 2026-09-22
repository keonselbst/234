import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { PageHeader, Panel, Empty } from "@/components/UI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Building2, X } from "lucide-react";

export default function Departments() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const ru = lang === "ru";
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ color: "#FF5722", custom_roles: [] });
  const [roleInput, setRoleInput] = useState("");

  const load = () => api.get("/departments").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const startAdd = () => { setEditing(null); setForm({ color: "#FF5722", custom_roles: [] }); setOpen(true); };
  const startEdit = (d) => { setEditing(d); setForm({ ...d, custom_roles: d.custom_roles || [] }); setOpen(true); };
  const save = async () => {
    try {
      if (editing) await api.put(`/departments/${editing.id}`, form);
      else await api.post("/departments", form);
      toast.success(ru ? "Сохранено" : "Saved");
      setOpen(false); load();
    } catch (e) { toast.error(e.response?.data?.detail || "Ошибка"); }
  };
  const del = async (id) => {
    if (!window.confirm(ru ? "Удалить отдел?" : "Delete department?")) return;
    try { await api.delete(`/departments/${id}`); load(); toast.success(ru ? "Удалено" : "Deleted"); }
    catch (e) { toast.error(e.response?.data?.detail || "Ошибка"); }
  };
  const addRole = () => {
    if (!roleInput.trim()) return;
    setForm({ ...form, custom_roles: [...(form.custom_roles || []), roleInput.trim()] });
    setRoleInput("");
  };
  const removeRole = (i) => setForm({ ...form, custom_roles: form.custom_roles.filter((_, idx) => idx !== i) });

  const isAdmin = user?.role === "admin";

  return (
    <div className="pt-4">
      <PageHeader
        testId="departments-header"
        eyebrow="Organization"
        title={t("departments")}
        subtitle={ru ? "Структура компании и кастомные роли для каждого отдела" : "Company structure and custom roles per department"}
        actions={isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={startAdd} data-testid="departments-add-btn" className="rounded-full bg-[#FF5722] hover:bg-[#FF6E40] h-9 px-4">
                <Plus className="w-4 h-4 mr-1" /> {t("add")}
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong border-white/10 rounded-3xl max-w-xl">
              <DialogHeader><DialogTitle className="font-heading text-xl">{editing ? t("edit") : t("add")} · {t("departments")}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.15em] text-white/50">{t("name")}</Label>
                  <Input data-testid="departments-name" value={form.name || ""} onChange={(e) => setForm({...form, name: e.target.value})} className="bg-black/30 border-white/10 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.15em] text-white/50">{t("description")}</Label>
                  <Textarea value={form.description || ""} onChange={(e) => setForm({...form, description: e.target.value})} className="bg-black/30 border-white/10 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.15em] text-white/50">{ru ? "Цвет отдела" : "Color"}</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.color || "#FF5722"} onChange={(e) => setForm({...form, color: e.target.value})} className="w-12 h-10 rounded-xl bg-transparent border border-white/10" />
                    <div className="mono text-sm">{form.color}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.15em] text-white/50">{ru ? "Кастомные роли отдела" : "Custom roles"}</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(form.custom_roles || []).map((r, i) => (
                      <div key={i} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs" style={{backgroundColor: (form.color || "#FF5722") + "22", color: form.color}}>
                        {r}
                        <button onClick={() => removeRole(i)} className="hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input value={roleInput} onChange={(e) => setRoleInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRole())} placeholder={ru ? "Добавить роль" : "Add role"} className="bg-black/30 border-white/10 rounded-xl" data-testid="departments-role-input" />
                    <Button type="button" onClick={addRole} variant="ghost" className="rounded-xl border border-white/10">+</Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-full">{t("cancel")}</Button>
                <Button data-testid="departments-save-btn" onClick={save} className="rounded-full bg-[#FF5722] hover:bg-[#FF6E40]">{t("save")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      />

      {items.length === 0 ? <Panel><Empty /></Panel> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="departments-grid">
          {items.map((d) => (
            <div key={d.id} className="glass rounded-3xl p-6 group transition-colors" data-testid={`department-${d.id}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl grid place-items-center" style={{backgroundColor: (d.color || "#FF5722") + "22"}}>
                  <Building2 className="w-5 h-5" style={{color: d.color || "#FF5722"}} />
                </div>
                {isAdmin && (
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(d)} data-testid={`departments-edit-${d.id}`} className="p-1.5 rounded-lg text-white/40 hover:text-white transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => del(d.id)} data-testid={`departments-del-${d.id}`} className="p-1.5 rounded-lg text-white/40 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>
              <h3 className="font-heading font-bold text-xl">{d.name}</h3>
              <p className="text-white/50 text-xs mt-1 line-clamp-2">{d.description}</p>
              {(d.custom_roles || []).length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="label-eyebrow mb-2">{ru ? "Роли" : "Roles"}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {d.custom_roles.map((r, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{backgroundColor: (d.color || "#FF5722") + "15", color: d.color || "#A0A5B5"}}>{r}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
