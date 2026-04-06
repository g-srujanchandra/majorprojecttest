import React, { useEffect } from "react";
import { BrowserRouter, Routes } from "react-router-dom";
import { adminRoutes } from "./Routes/AdminRoutes";
import { userRoutes } from "./Routes/UserRoutes";
import { TransactionProvider } from "./context/TransactionContext";
import axios from "axios";
import { serverLink } from "./Data/Variables";

function App() {
  
  useEffect(() => {
    // 🛡️ GLOBAL AXIOS SAFETY: Force use of the correct base URL
    const root = (serverLink || "").replace("/api/auth/", "");
    if (root) axios.defaults.baseURL = root;
  }, []);

  return (
    <TransactionProvider>

      <BrowserRouter>

        <Routes>

          {userRoutes}

          {adminRoutes}

        </Routes>

      </BrowserRouter>

    </TransactionProvider>
  );

}

export default App;