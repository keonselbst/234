import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import {
  LayoutDashboard, Package, Sparkles, FileBox, Users2, Truck, CalendarClock,
  Wallet, UserCog, Building2, Bot, LogOut, Languages, Fan
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const items = [
  { to: "/", icon: LayoutDashboard, key: "dashboard" },
  { to: "/materials", icon: Package, key: "materials" },
  { to: "/leads", icon: Sparkles, key: "leads" },
  { to: "/models", icon: FileBox, key: "models" },
  { to: "/customers", icon: Users2, key: "customers" },
  { to: "/suppliers", icon: Truck, key: "suppliers" },
  { to: "/orders", icon: CalendarClock, key: "orders" },
  { to: "/budget", icon: Wallet, key: "budget" },
  { to: "/employees", icon: UserCog, key: "employees" },
  { to: "/departments", icon: Building2, key: "departments" },
  { to: "/assistant", icon: Bot, key: "assistant" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const loc = useLocation();
  const nav = useNavigate();

  return (
    <aside className="glass rounded-3xl m-4 mr-2 w-64 flex flex-col shrink-0 sticky top-4 h-[calc(100vh-2rem)] z-20" data-testid="sidebar">
      <div className="p-6 flex items-center gap-3 border-b border-white/5">
        <div className="w-10 h-10 rounded-2xl bg-accent-orange grid place-items-center shadow-lg shadow-orange-500/30">
          <Fan className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <div className="font-heading font-extrabold text-sm tracking-tight">FanOps</div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-white/50">Industrial ERP</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((it) => {
          const active = it.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(it.to);
          const Icon = it.icon;
          return (
            <Link
              key={it.key}
              to={it.to}
              data-testid={`nav-${it.key}`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-200 ${
                active
                  ? "bg-white/10 text-white shadow-inner"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? "text-[#FF5722]" : ""}`} strokeWidth={2} />
              <span className="text-sm font-medium">{t(it.key)}</span>
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FF5722]" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/5 space-y-2">
        <button
          data-testid="lang-toggle"
          onClick={() => setLang(lang === "ru" ? "en" : "ru")}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Languages className="w-4 h-4" />
          <span className="uppercase tracking-[0.2em]">{lang}</span>
          <span className="ml-auto text-white/40 text-[10px]">{lang === "ru" ? "EN →" : "RU →"}</span>
        </button>

        <button
          data-testid="profile-btn"
          onClick={() => nav("/profile")}
          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group"
        >
          <Avatar className="w-9 h-9 ring-1 ring-white/10">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback className="bg-white/5 text-white text-xs">
              {(user?.full_name || user?.username || "?").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-left min-w-0 flex-1">
            <div className="text-xs font-medium truncate">{user?.full_name || user?.username}</div>
            <div className="text-[10px] text-white/40 truncate mono">{user?.access_uid}</div>
          </div>
        </button>

        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          data-testid="logout-btn"
          className="w-full justify-start text-white/60 hover:text-white hover:bg-white/5 rounded-xl"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {t("logout")}
        </Button>
      </div>
    </aside>
  );
}
