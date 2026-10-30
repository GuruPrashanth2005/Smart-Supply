import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { ProcurementPage } from './pages/ProcurementPage';
import { ForecastPage } from './pages/ForecastPage';
import { RecipesPage } from './pages/RecipesPage';
import { InventoryPage } from './pages/InventoryPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { RescuePage } from './pages/RescuePage';
import { TransactionsPage } from './pages/TransactionsPage';
import { ReceptionPage } from './pages/ReceptionPage';
import { SupplierPortalPage } from './pages/SupplierPortalPage';

export function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="dashboard" element={<Navigate to="/" replace />} />
            <Route path="reception" element={<ReceptionPage />} />
            <Route path="supplier-portal" element={<SupplierPortalPage />} />
            <Route path="procurement" element={<ProcurementPage />} />
            <Route path="forecast" element={<ForecastPage />} />
            <Route path="recipes" element={<RecipesPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="rescue" element={<RescuePage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;
