import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

export default function Shell() {
  return (
    <div className="App min-h-screen flex grain ambient relative">
      <Sidebar />
      <main className="flex-1 min-w-0 p-4 pr-6 relative z-10">
        <div className="mx-auto max-w-[1600px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
