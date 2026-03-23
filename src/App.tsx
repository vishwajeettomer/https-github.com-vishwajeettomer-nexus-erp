import { useState, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './modules/Login';

// Lazy load modules to improve initial load time
const Dashboard = lazy(() => import('./modules/Dashboard'));
const Inventory = lazy(() => import('./modules/Inventory'));
const Sales = lazy(() => import('./modules/Sales'));
const Production = lazy(() => import('./modules/Production'));
const Purchase = lazy(() => import('./modules/Purchase'));
const Master = lazy(() => import('./modules/Master'));
const Reports = lazy(() => import('./modules/Reports'));
const Settings = lazy(() => import('./modules/Settings'));
const Admin = lazy(() => import('./modules/Admin'));

function LoadingFallback() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent shadow-lg shadow-indigo-100"></div>
        <p className="text-sm font-medium text-slate-500">Loading module...</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'inventory': return <Inventory />;
      case 'sales': return <Sales />;
      case 'purchase': return <Purchase />;
      case 'production': return <Production />;
      case 'reports': return <Reports />;
      case 'master': return <Master />;
      case 'admin': return <Admin />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <Suspense fallback={<LoadingFallback />}>
        {renderContent()}
      </Suspense>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
