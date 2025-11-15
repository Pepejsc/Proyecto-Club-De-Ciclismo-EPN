import React from "react";
import Sidebar from "../../components/Normal/Sidebar";
import Header from "../../components/Normal/Header";
import { Outlet } from "react-router-dom";
import { useSidebar } from "../../context/Admin/SidebarContext";

const Dashboard = () => {
  const { isCollapsed } = useSidebar();
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-container">
        <Header />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>


  );
};

export default Dashboard;
