import React from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Dashboard from "./pages/Dashboard";
import { AppProvider } from "./context/AppContext";
import "./styles/global.css";

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen scroll-smooth">
        <Header />
        <Dashboard />
        <Footer />
      </div>
    </AppProvider>
  );
}
