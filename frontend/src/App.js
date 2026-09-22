import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import { Toaster } from "sonner";
import Login from "@/pages/Login";
import Shell from "@/components/Shell";
import Dashboard from "@/pages/Dashboard";
import Materials from "@/pages/Materials";
import Leads from "@/pages/Leads";
import Models from "@/pages/Models";
import Customers from "@/pages/Customers";
import Suppliers from "@/pages/Suppliers";
import Orders from "@/pages/Orders";
import Budget from "@/pages/Budget";
import Employees from "@/pages/Employees";
import Departments from "@/pages/Departments";
import Assistant from "@/pages/Assistant";
import Profile from "@/pages/Profile";
import "@/App.css";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-white/40 text-sm">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster theme="dark" position="top-right" toastOptions={{ style: { background: "rgba(15,17,26,0.9)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)", color: "#fff" } }} />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Protected><Shell /></Protected>}>
              <Route index element={<Dashboard />} />
              <Route path="/materials" element={<Materials />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/models" element={<Models />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/budget" element={<Budget />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/departments" element={<Departments />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;
