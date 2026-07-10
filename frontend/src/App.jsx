import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import StockDetail from "./pages/StockDetail.jsx";

function App() {
  return (
    <div className="min-h-screen text-gray-100">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/stock/:ticker" element={<StockDetail />} />
      </Routes>
    </div>
  );
}

export default App;
