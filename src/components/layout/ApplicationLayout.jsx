import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

export default function ApplicationLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main-wrapper">
        <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <main className="app-content" id="main-content">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
