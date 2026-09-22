import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { PageHeader, Panel, Empty } from "@/components/UI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Upload, FileBox, Search } from "lucide-react";

export default function Models() {
  const { t, lang } = useI18n();
  const ru = lang === "ru";
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [q, setQ] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = () => api.get("/models").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const uploadFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setForm({ ...form, preview_url: r.data.data_url, file_name: r.data.filename, file_size: r.data.size });
      toast.success(ru ? "Файл загружен" : "File uploaded");
    } catch (err) { toast.error(err.response?.data?.detail || "Ошибка"); }
    setUploading(false);
  };

  const save = async () => {
    await api.post("/models", form); setOpen(false); setForm({}); load();
    toast.success(ru ? "Модель сохранена" : "Model saved");
  };
  const del = async (id) => {
    if (!window.confirm(ru ? "Удалить модель?" : "Delete model?")) return;
    await api.delete(`/models/${id}`); load(); toast.success(ru ? "Удалено" : "Deleted");
  };

  const filtered = items.filter((it) => !q || JSON.stringify(it).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="pt-4">
      <PageHeader
        testId="models-header"
        eyebrow="CAD & Drawings"
        title={t("models")}
        subtitle={ru ? "База моделей вентиляторов и чертежей с превью" : "Fan models and drawings database with previews"}
        actions={
          <div className="flex items-center gap-2">
            <div className="glass rounded-full px-3 py-1.5 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-white/40" />
              <input value={q} onChange={(e) => setQ(e.target.value)} data-testid="models-search" placeholder={t("search")} className="bg-transparent outline-none text-xs w-40 placeholder:text-white/30" />
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="models-add-btn" className="rounded-full bg-[#FF5722] hover:bg-[#FF6E40] h-9 px-4">
                  <Plus className="w-4 h-4 mr-1" /> {t("add")}
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-strong border-white/10 rounded-3xl max-w-2xl">
                <DialogHeader><DialogTitle className="font-heading text-xl">{ru ? "Новая модель / чертёж" : "New model / drawing"}</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-2">
                  <div className="space-y-2 col-span-2">
                    <Label className="text-xs uppercase tracking-[0.15em] text-white/50">{ru ? "Название модели" : "Model name"}</Label>
                    <Input data-testid="models-name" value={form.name || ""} onChange={(e) => setForm({...form, name: e.target.value})} className="bg-black/30 border-white/10 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-[0.15em] text-white/50">{ru ? "Артикул" : "SKU"}</Label>
                    <Input data-testid="models-sku" value={form.sku || ""} onChange={(e) => setForm({...form, sku: e.target.value})} className="bg-black/30 border-white/10 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-[0.15em] text-white/50">{ru ? "Мощность, кВт" : "Power, kW"}</Label>
                    <Input type="number" value={form.power || ""} onChange={(e) => setForm({...form, power: Number(e.target.value)})} className="bg-black/30 border-white/10 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-[0.15em] text-white/50">{ru ? "Расход воздуха, м³/ч" : "Airflow, m³/h"}</Label>
                    <Input type="number" value={form.airflow || ""} onChange={(e) => setForm({...form, airflow: Number(e.target.value)})} className="bg-black/30 border-white/10 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-[0.15em] text-white/50">{ru ? "Диаметр, мм" : "Diameter, mm"}</Label>
                    <Input type="number" value={form.diameter || ""} onChange={(e) => setForm({...form, diameter: Number(e.target.value)})} className="bg-black/30 border-white/10 rounded-xl" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label className="text-xs uppercase tracking-[0.15em] text-white/50">{ru ? "Описание" : "Description"}</Label>
                    <Textarea value={form.description || ""} onChange={(e) => setForm({...form, description: e.target.value})} className="bg-black/30 border-white/10 rounded-xl" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label className="text-xs uppercase tracking-[0.15em] text-white/50">{ru ? "Файл чертежа (JPG/PNG/PDF)" : "Drawing file (JPG/PNG/PDF)"}</Label>
                    <label className="flex items-center gap-3 p-4 rounded-xl bg-black/30 border border-dashed border-white/20 hover:border-[#FF5722]/50 cursor-pointer transition-colors">
                      <Upload className="w-5 h-5 text-white/50" />
                      <span className="text-sm text-white/70">{form.file_name || (uploading ? (ru ? "Загрузка..." : "Uploading...") : (ru ? "Выберите файл" : "Choose file"))}</span>
                      <input type="file" data-testid="models-file-input" onChange={uploadFile} className="hidden" accept="image/*,.pdf" />
                    </label>
                    {form.preview_url && form.preview_url.startsWith("data:image") && (
                      <img src={form.preview_url} alt="preview" className="rounded-xl max-h-40 mt-2" />
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-full">{t("cancel")}</Button>
                  <Button data-testid="models-save-btn" onClick={save} className="rounded-full bg-[#FF5722] hover:bg-[#FF6E40]">{t("save")}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {filtered.length === 0 ? (
        <Panel><Empty text={ru ? "Пока нет моделей. Добавьте первую." : "No models yet. Add the first one."} /></Panel>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="models-grid">
          {filtered.map((m) => (
            <div key={m.id} className="glass glass-hover rounded-3xl overflow-hidden group transition-colors" data-testid={`model-card-${m.id}`}>
              <div className="aspect-[4/3] bg-black/40 relative overflow-hidden">
                {m.preview_url && m.preview_url.startsWith("data:image") ? (
                  <img src={m.preview_url} alt={m.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center bg-gradient-to-br from-[#0F111A] to-[#090A0F]">
                    <FileBox className="w-12 h-12 text-white/20" />
                  </div>
                )}
                <button onClick={() => del(m.id)} data-testid={`models-del-${m.id}`} className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-md text-white/60 hover:text-red-400 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-4">
                <div className="text-[10px] mono text-white/40 uppercase">{m.sku}</div>
                <div className="font-heading font-bold text-lg mt-1">{m.name}</div>
                <div className="text-xs text-white/60 mt-2 line-clamp-2">{m.description}</div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-[11px]">
                  <div><div className="text-white/40">кВт</div><div className="font-semibold text-[#FF5722]">{m.power || "—"}</div></div>
                  <div><div className="text-white/40">м³/ч</div><div className="font-semibold text-[#E1FF00]">{m.airflow || "—"}</div></div>
                  <div><div className="text-white/40">Ø мм</div><div className="font-semibold">{m.diameter || "—"}</div></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
