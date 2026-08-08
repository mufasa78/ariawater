import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { CartProvider } from '@/lib/cart-context';
import { AppLayout, AdminLayout } from '@/components/layout/Layouts';
import { CookieConsentBanner } from '@/components/layout/CookieConsentBanner';
import { useEffect } from 'react';
import { trackPageView } from '@/lib/analytics';
import { setBaseUrl } from '@workspace/api-client-react';
import { ClerkProvider } from '@clerk/clerk-react';
import { ClerkAuthWrapper, useAuth } from '@/lib/clerk-auth-wrapper';

// Initialize API client base URL
// Use relative URL since API is deployed on same domain via Vercel serverless
const apiUrl = import.meta.env.VITE_API_URL;
if (apiUrl) {
  // Only set base URL if explicitly configured (for different domains)
  // Otherwise, use relative URLs which work on same domain
  setBaseUrl(apiUrl);
} else {
  // Default: use same domain (no base URL needed)
  setBaseUrl('');
}

// Clerk configuration
const CLERK_PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  import.meta.env.VITE_CLERK_PUBLIC_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error(
    'Missing Clerk browser key. Set VITE_CLERK_PUBLISHABLE_KEY in the Vercel Preview environment.'
  );
}

// Pages
import Landing from '@/pages/Landing';
import Shop from '@/pages/Shop';
import Login from '@/pages/Login';
import SignUp from '@/pages/SignUp';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';
import CookiePolicy from '@/pages/CookiePolicy';
import About from '@/pages/About';
import Track from '@/pages/Track';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminOrders from '@/pages/AdminOrders';
import AdminProducts from '@/pages/AdminProducts';
import AdminMarketing from '@/pages/AdminMarketing';
import AdminAccounting from '@/pages/AdminAccounting';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

// ── Page-view tracking ────────────────────────────────────────────────────────
function PageTracker() {
  const [location] = useLocation();
  useEffect(() => { trackPageView(location); }, [location]);
  return null;
}

// ── Route guards ──────────────────────────────────────────────────────────────
function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      setLocation('/login');
    }
  }, [isLoading, user, setLocation]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }
  
  if (!user || user.role !== 'admin') {
    return null;
  }
  
  return <AdminLayout><Component /></AdminLayout>;
}

function PublicRoute({ component: Component, hideLayout = false }: { component: React.ComponentType; hideLayout?: boolean }) {
  if (hideLayout) return <Component />;
  return <AppLayout><Component /></AppLayout>;
}

function Router() {
  return (
    <>
      <PageTracker />
      <Switch>
        {/* Public */}
        <Route path="/" component={() => <PublicRoute component={Landing} />} />
        <Route path="/shop" component={() => <PublicRoute component={Shop} />} />
        <Route path="/about" component={() => <PublicRoute component={About} />} />
        <Route path="/track" component={() => <PublicRoute component={Track} />} />

        {/* Auth */}
        <Route path="/login" component={() => <PublicRoute component={Login} hideLayout />} />
        <Route path="/login/:rest*" component={() => <PublicRoute component={Login} hideLayout />} />
        <Route path="/sign-up" component={() => <PublicRoute component={SignUp} hideLayout />} />
        <Route path="/sign-up/:rest*" component={() => <PublicRoute component={SignUp} hideLayout />} />

        {/* Policies */}
        <Route path="/privacy" component={() => <PublicRoute component={Privacy} />} />
        <Route path="/terms" component={() => <PublicRoute component={Terms} />} />
        <Route path="/cookie-policy" component={() => <PublicRoute component={CookiePolicy} />} />

        {/* Admin */}
        <Route path="/admin" component={() => <AdminRoute component={AdminDashboard} />} />
        <Route path="/admin/orders" component={() => <AdminRoute component={AdminOrders} />} />
        <Route path="/admin/products" component={() => <AdminRoute component={AdminProducts} />} />
        <Route path="/admin/marketing" component={() => <AdminRoute component={AdminMarketing} />} />
        <Route path="/admin/accounting" component={() => <AdminRoute component={AdminAccounting} />} />

        {/* 404 */}
        <Route component={() => <PublicRoute component={NotFound} />} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <ClerkAuthWrapper>
            <CartProvider>
              {/*
                CookieConsentBanner wraps the app as a context provider so any
                component can call useConsent() to check analytics/marketing consent.
                The visible banner and manage-preferences modal are rendered inside it.
              */}
              <CookieConsentBanner>
                <TooltipProvider>
                  <Router />
                  <Toaster />
                </TooltipProvider>
              </CookieConsentBanner>
            </CartProvider>
          </ClerkAuthWrapper>
        </WouterRouter>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
