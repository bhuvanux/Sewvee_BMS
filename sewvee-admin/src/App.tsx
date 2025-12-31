import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './auth/LoginPage';
import { DashboardPage } from './modules/dashboard/DashboardPage';
import { ClientsPage } from './modules/clients/ClientsPage';
import { ClientDetailPage } from './modules/clients/ClientDetailPage';
import { PaymentsPage } from './modules/payments/PaymentsPage';
import { AnalyticsPage } from './modules/analytics/AnalyticsPage';
import { ReportsPage } from './modules/reports/ReportsPage';
import { MainLayout } from './layouts/MainLayout';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/clients/:clientId" element={<ClientDetailPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<div className="p-8"><h1 className="text-2xl font-bold">Settings</h1><p>Platform configuration coming soon.</p></div>} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
