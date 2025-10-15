import React, { createContext, useContext, useState } from "react";

const ModeContext = createContext();
const RoleContext = createContext();

export function AppProvider({ children }) {
  const [mode, setMode] = useState("Beginner"); // Beginner | Expert
  const [role, setRole] = useState("Analyst");  // Viewer | Analyst | Admin
  return (
    <ModeContext.Provider value={{ mode, setMode }}>
      <RoleContext.Provider value={{ role, setRole }}>
        {children}
      </RoleContext.Provider>
    </ModeContext.Provider>
  );
}

export const useMode = () => useContext(ModeContext);
export const useRole = () => useContext(RoleContext);
