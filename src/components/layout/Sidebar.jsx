import React, { useState, useEffect } from "react";
import { LogOut, ChevronLeft } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { NAV_ITEMS } from "../../config/navigation";

import logoSmall from "../../assets/logo/logo-small.png";

const Sidebar = ({ isOpen, onClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  }, [location.pathname]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40 h-screen
          bg-bukizz-navy text-white
          transition-all duration-300 ease-in-out
          flex flex-col border-r border-slate-800
          overflow-x-hidden
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsed ? "lg:w-20" : "lg:w-[260px] w-[260px]"}
        `}
      >
        {/* Logo Area */}
        <div
          className={`h-16 flex items-center border-b border-slate-800 transition-all ${
            isCollapsed ? "justify-center gap-1 px-1" : "justify-between px-6"
          }`}
        >
          {!isCollapsed ? (
            <span className="text-xl font-bold tracking-tight text-white truncate">
              Bukizz Admin
            </span>
          ) : (
            // Logo Icon when collapsed
            <img
              src={logoSmall}
              alt="Bukizz"
              className="w-10 h-10 object-contain shrink-0"
            />
          )}

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex p-1.5 rounded-md text-slate-400 hover:text-white transition-colors ${
              !isCollapsed
                ? "bg-slate-800 hover:bg-slate-700"
                : "hover:bg-white/10"
            }`}
          >
            <ChevronLeft
              size={16}
              className={`transition-transform duration-300 ${
                isCollapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-1">
          {NAV_ITEMS.map((item, index) => {
            // Render Group
            if (item.group && item.items) {
              return (
                <div key={index} className="mb-6">
                  {!isCollapsed && (
                    <div className="px-3 mb-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      {item.group}
                    </div>
                  )}
                  <div className="space-y-1">
                    {item.items.map((subItem) => (
                      <NavItem
                        key={subItem.path}
                        item={subItem}
                        isCollapsed={isCollapsed}
                      />
                    ))}
                  </div>
                </div>
              );
            }

            // Render Single Item (if marked as main group or just standalone)
            if (item.group === "main") {
              return (
                <NavItem
                  key={item.path}
                  item={item}
                  isCollapsed={isCollapsed}
                />
              );
            }

            return null;
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 mt-auto">
          <button
            className={`w-full flex items-center ${
              isCollapsed ? "justify-center" : "px-4 gap-3"
            } py-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all group`}
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="font-medium">Log Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

const NavItem = ({ item, isCollapsed }) => {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      title={isCollapsed ? item.label : ""}
      className={({ isActive }) => `
        flex items-center 
        ${isCollapsed ? "justify-center px-2" : "px-3 gap-3"} 
        py-2.5 rounded-lg transition-all duration-200 relative group
        ${
          isActive
            ? "bg-[#1e293b] text-[#f97316]"
            : "text-slate-400 hover:text-white hover:bg-white/5"
        }
      `}
    >
      {({ isActive }) => (
        <>
          {/* Active Left Border Indicator (Optional polish) */}
          {isActive && !isCollapsed && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#f97316] rounded-r-full hidden" />
          )}

          <Icon
            size={20}
            className={`
                min-w-[20px]
                ${
                  isActive
                    ? "text-[#f97316]"
                    : "text-slate-400 group-hover:text-white"
                }
            `}
          />

          {!isCollapsed && (
            <span className="font-medium whitespace-nowrap overflow-hidden">
              {item.label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
};

export default Sidebar;
