import React from "react";
import { Bell, Search, Menu, User } from "lucide-react";

const Header = ({ onMenuClick }) => {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
      {/* Left: Breadcrumbs & Toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg hover:bg-slate-100 lg:hidden text-slate-600"
        >
          <Menu size={20} />
        </button>

        <div className="hidden sm:flex items-center text-sm text-slate-500">
          <span className="hover:text-slate-800 cursor-pointer">Admin</span>
          <span className="mx-2">/</span>
          <span className="font-medium text-slate-800">Dashboard</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden md:flex items-center px-3 py-2 bg-slate-100 rounded-lg border border-transparent focus-within:border-slate-300 focus-within:bg-white transition-all">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm ml-2 w-48 text-slate-600 placeholder:text-slate-400"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-slate-700">Admin User</p>
            <p className="text-xs text-slate-500">admin@bukizz.com</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 border border-slate-300">
            <User size={18} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
