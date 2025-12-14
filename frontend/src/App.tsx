import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Sales } from './pages/Sales';
import { Customers } from './pages/Customers';
import { Products } from './pages/Products';
import { Marketing } from './pages/Marketing';
import { Predictions } from './pages/Predictions';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/sales" element={<Sales />} />
      <Route path="/customers" element={<Customers />} />
      <Route path="/products" element={<Products />} />
      <Route path="/marketing" element={<Marketing />} />
      <Route path="/predictions" element={<Predictions />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
