"use client";

import { useState } from "react";
import { Video, Settings, Bell, ChevronDown, Search } from "lucide-react";

export default function Navbar() {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      {/* Left — Logo */}
      <div className="flex items-center gap-2">
        <div className="bg-blue-600 p-1.5 rounded-lg">
          <Video className="text-white w-5 h-5" />
        </div>
        <span className="text-xl font-bold text-gray-800">Zoom</span>
      </div>

      {/* Center — Search */}
      <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2 w-72">
        <Search className="w-4 h-4 text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search"
          className="bg-transparent text-sm outline-none w-full text-gray-600 placeholder-gray-400"
        />
      </div>

      {/* Right — Icons + Profile */}
      <div className="flex items-center gap-4">
        <button className="text-gray-500 hover:text-gray-700 transition">
          <Bell className="w-5 h-5" />
        </button>
        <button className="text-gray-500 hover:text-gray-700 transition">
          <Settings className="w-5 h-5" />
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
              J
            </div>
            <span className="hidden md:block text-sm font-medium text-gray-700">
              John Doe
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">John Doe</p>
                <p className="text-xs text-gray-500">john@zoomclone.com</p>
              </div>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                My Profile
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                Settings
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50">
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}