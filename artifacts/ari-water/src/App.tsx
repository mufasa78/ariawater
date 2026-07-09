import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';
import { AppLayout, AdminLayout } from '@/components/layout/Layouts';

// Pages
import Landing from '@/pages/Landing';
import Shop from '@/pages/Shop';
import Orders from '@/pages/Orders';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminOrders from '@/pages/AdminOrders';
import AdminProducts from '@/pages/AdminProducts';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

// Protected route wrappers
function CustomerRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) {
    setLocation('/login');
    return null;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user || user.role !== 'admin') {
    setLocation('/login');
    return null;
  }

  return (
    <AdminLayout>
      <Component />
    </AdminLayout>
  );
}

function PublicRoute({ component: Component, hideLayout = false }: { component: React.ComponentType, hideLayout?: boolean }) {
  if (hideLayout) {
    return <Component />;
  }
  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={() => <PublicRoute component={Landing} />} />
      <Route path="/shop" component={() => <PublicRoute component={Shop} />} />
      
      {/* Auth Routes (No layout) */}
      <Route path="/login" component={() => <PublicRoute component={Login} hideLayout />} />
      <Route path="/register" component={() => <PublicRoute component={Register} hideLayout />} />
      
      {/* Customer Routes */}
      <Route path="/orders" component={() => <CustomerRoute component={Orders} />} />
      
      {/* Admin Routes */}
      <Route path="/admin" component={() => <AdminRoute component={AdminDashboard} />} />
      <Route path="/admin/orders" component={() => <AdminRoute component={AdminOrders} />} />
      <Route path="/admin/products" component={() => <AdminRoute component={AdminProducts} />} />
      
      {/* 404 */}
      <Route component={() => <PublicRoute component={NotFound} />} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <AuthProvider>
          <CartProvider>
            <TooltipProvider>
              <Router />
              <Toaster />
            </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
