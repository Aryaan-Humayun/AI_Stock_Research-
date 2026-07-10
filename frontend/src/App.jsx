import { Routes, Route, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import StockDetail from "./pages/StockDetail.jsx";

function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen text-text-primary">
      <div key={location.pathname} className="animate-fade-in">
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/stock/:ticker" element={<StockDetail />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
