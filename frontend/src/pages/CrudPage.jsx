import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { PageHeader, Panel, Empty } from "@/components/UI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Search, Pencil } from "lucide-react";

/**
 * Generic CRUD panel builder used by multiple pages.
 * @param {Object} props
 * @param {string} props.endpoint  - api path e.g. "materials"
 * @param {string} props.titleKey  - i18n key
 * @param {string} props.eyebrow
 * @param {Array} props.fields     - {name, label, type, options?, placeholder?, span?}
 * @param {Array} props.columns    - {key, label, format?, tone?}
 */
export default function CrudPage({ endpoint, titleKey, eyebrow, fields, columns, extraActions, testIdPrefix }) {
  const { t, lang } = useI18n();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [q, setQ] = useState("");

  const load = async () => {
    const r = await api.get(`/${endpoint}`);
    setItems(r.data);
  };
  useEffect(() => { load(); }, [endpoint]);

  const startAdd = () => { setEditing(null); setForm({}); setOpen(true); };
  const startEdit = (item) => { setEditing(item); setForm({ ...item }); setOpen(true); };
  const save = async () => {
    try {
      if (editing) await api.put(`/${endpoint}/${editing.id}`, form);
      else await api.post(`/${endpoint}`, form);
      toast.success(lang === "ru" ? "Сохранено" : "Saved");
      setOpen(false); load();
    } catch (e) { toast.error(e.response?.data?.detail || "Ошибка"); }
  };
  const del = async (id) => {
    if (!window.confirm(lang === "ru" ? "Удалить запись?" : "Delete this record?")) return;
    await api.delete(`/${endpoint}/${id}`); toast.success(lang === "ru" ? "Удалено" : "Deleted"); load();
  };

  const filtered = items.filter((it) => !q || JSON.stringify(it).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="pt-4">
      <PageHeader
        testId={`${testIdPrefix}-header`}
        eyebrow={eyebrow}
        title={t(titleKey)}
        actions={
          <div className="flex items-center gap-2">
            <div className="glass rounded-full px-3 py-1.5 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-white/40" />
              <input
                data-testid={`${testIdPrefix}-search`}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("search")}
                className="bg-transparent outline-none text-xs w-40 placeholder:text-white/30"
              />
            </div>
            {extraActions}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={startAdd}
                  data-testid={`${testIdPrefix}-add-btn`}
                  className="rounded-full bg-[#FF5722] hover:bg-[#FF6E40] text-white h-9 px-4"
                >
                  <Plus className="w-4 h-4 mr-1" /> {t("add")}
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-strong border-white/10 rounded-3xl max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="font-heading text-xl">{editing ? t("edit") : t("add")} · {t(titleKey)}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-2">
                  {fields.map((f) => (
                    <div key={f.name} className={`space-y-2 ${f.span === 2 ? "col-span-2" : ""}`}>
                      <Label className="text-xs uppercase tracking-[0.15em] text-white/50">{f.label}</Label>
                      {f.type === "textarea" ? (
                        <Textarea
                          data-testid={`${testIdPrefix}-field-${f.name}`}
                          value={form[f.name] || ""}
                          onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                          className="bg-black/30 border-white/10 rounded-xl min-h-[80px]"
                        />
                      ) : f.type === "select" ? (
                        <Select value={form[f.name] || ""} onValueChange={(v) => setForm({ ...form, [f.name]: v })}>
                          <SelectTrigger data-testid={`${testIdPrefix}-field-${f.name}`} className="bg-black/30 border-white/10 rounded-xl">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent className="glass-strong border-white/10">
                            {f.options?.map((o) => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type={f.type || "text"}
                          data-testid={`${testIdPrefix}-field-${f.name}`}
                          value={form[f.name] || ""}
                          onChange={(e) => setForm({ ...form, [f.name]: f.type === "number" ? Number(e.target.value) : e.target.value })}
                          className="bg-black/30 border-white/10 rounded-xl"
                          placeholder={f.placeholder}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-full">{t("cancel")}</Button>
                  <Button data-testid={`${testIdPrefix}-save-btn`} onClick={save} className="rounded-full bg-[#FF5722] hover:bg-[#FF6E40]">{t("save")}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <Panel testId={`${testIdPrefix}-table`}>
        {filtered.length === 0 ? <Empty text={lang === "ru" ? "Пока пусто. Добавьте первую запись." : "Empty. Add the first record."} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid={`${testIdPrefix}-list`}>
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                  {columns.map((c) => <th key={c.key} className="text-left font-medium py-3 px-3">{c.label}</th>)}
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((it) => (
                  <tr key={it.id} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors">
                    {columns.map((c) => (
                      <td key={c.key} className="py-3 px-3">
                        {c.render ? c.render(it) : (c.format ? c.format(it[c.key]) : (it[c.key] ?? "—"))}
                      </td>
                    ))}
                    <td className="text-right pr-2">
                      <button onClick={() => startEdit(it)} data-testid={`${testIdPrefix}-edit-${it.id}`} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors mr-1">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => del(it.id)} data-testid={`${testIdPrefix}-del-${it.id}`} className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
