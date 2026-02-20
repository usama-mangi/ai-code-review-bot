import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { ReviewHistory } from "./pages/ReviewHistory";
import { ReviewDetail } from "./pages/ReviewDetail";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="reviews" element={<ReviewHistory />} />
          <Route path="reviews/:id" element={<ReviewDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
