import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from './i18n/i18nContext';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthLockProvider } from './lib/authLockContext';
import { UserAuthProvider } from './lib/userAuthContext';
import { LockGuard } from './components/LockGuard';
import { AuthGateRedirect } from './components/AuthGateRedirect';
import { BottomNav } from './components/BottomNav';
import { OfflineBanner } from './components/OfflineBanner';
import { ScrollToTop } from './components/ScrollToTop';
import { PageSkeleton } from './components/PageSkeleton';
import { seedInitialDatabaseIfEmpty } from './lib/db';

// Lazy-loaded route pages for performance & code splitting
const WelcomePage = lazy(() =>
  import('./pages/WelcomePage').then((m) => ({ default: m.WelcomePage }))
);
const AuthPage = lazy(() =>
  import('./pages/AuthPage').then((m) => ({ default: m.AuthPage }))
);
const SetupPinPage = lazy(() =>
  import('./pages/SetupPinPage').then((m) => ({ default: m.SetupPinPage }))
);
const LockPage = lazy(() =>
  import('./pages/LockPage').then((m) => ({ default: m.LockPage }))
);
const HomePage = lazy(() =>
  import('./pages/HomePage').then((m) => ({ default: m.HomePage }))
);
const AddExpensePage = lazy(() =>
  import('./pages/AddExpensePage').then((m) => ({ default: m.AddExpensePage }))
);
const ExpensesPage = lazy(() =>
  import('./pages/ExpensesPage').then((m) => ({ default: m.ExpensesPage }))
);
const ExpenseDetailPage = lazy(() =>
  import('./pages/ExpenseDetailPage').then((m) => ({ default: m.ExpenseDetailPage }))
);
const ScamShieldPage = lazy(() =>
  import('./pages/ScamShieldPage').then((m) => ({ default: m.ScamShieldPage }))
);
const QuestPage = lazy(() =>
  import('./pages/QuestPage').then((m) => ({ default: m.QuestPage }))
);
const KidQuestPage = lazy(() =>
  import('./pages/KidQuestPage').then((m) => ({ default: m.KidQuestPage }))
);
const InsightsPage = lazy(() =>
  import('./pages/InsightsPage').then((m) => ({ default: m.InsightsPage }))
);
const AskAmmaPage = lazy(() =>
  import('./pages/AskAmmaPage').then((m) => ({ default: m.AskAmmaPage }))
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const ChangePinPage = lazy(() =>
  import('./pages/ChangePinPage').then((m) => ({ default: m.ChangePinPage }))
);
const PrivacyPage = lazy(() =>
  import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage }))
);
const DesignSystemPage = lazy(() =>
  import('./pages/DesignSystemPage').then((m) => ({ default: m.DesignSystemPage }))
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

export function App() {
  useEffect(() => {
    // Initialize seed data if database is empty on first boot
    seedInitialDatabaseIfEmpty();
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <I18nProvider>
          <ToastProvider>
            <UserAuthProvider>
              <AuthLockProvider>
                <ScrollToTop />
                <OfflineBanner />

                <div className="min-h-screen bg-[#FFF8EC] text-[#3E2723] font-sans antialiased">
                  <Suspense fallback={<PageSkeleton />}>
                    <Routes>
                      {/* Root Redirection Logic */}
                      <Route path="/" element={<AuthGateRedirect />} />

                      {/* Public Auth / Onboarding routes */}
                      <Route path="/welcome" element={<WelcomePage />} />
                      <Route path="/auth" element={<AuthPage />} />
                      <Route path="/setup-pin" element={<SetupPinPage />} />
                      <Route path="/lock" element={<LockPage />} />

                    {/* Developer Design System (dev preview route) */}
                    <Route path="/design" element={<DesignSystemPage />} />

                    {/* Protected Authenticated Routes (wrapped in LockGuard) */}
                    <Route
                      path="/home"
                      element={
                        <LockGuard>
                          <HomePage />
                        </LockGuard>
                      }
                    />
                    <Route
                      path="/add"
                      element={
                        <LockGuard>
                          <AddExpensePage />
                        </LockGuard>
                      }
                    />
                    <Route
                      path="/expenses"
                      element={
                        <LockGuard>
                          <ExpensesPage />
                        </LockGuard>
                      }
                    />
                    <Route
                      path="/expenses/:id"
                      element={
                        <LockGuard>
                          <ExpenseDetailPage />
                        </LockGuard>
                      }
                    />
                    <Route
                      path="/scam-shield"
                      element={
                        <LockGuard>
                          <ScamShieldPage />
                        </LockGuard>
                      }
                    />
                    <Route
                      path="/quest"
                      element={
                        <LockGuard>
                          <QuestPage />
                        </LockGuard>
                      }
                    />
                    <Route
                      path="/quest/:kidId"
                      element={
                        <LockGuard>
                          <KidQuestPage />
                        </LockGuard>
                      }
                    />
                    <Route
                      path="/insights"
                      element={
                        <LockGuard>
                          <InsightsPage />
                        </LockGuard>
                      }
                    />
                    <Route
                      path="/ask"
                      element={
                        <LockGuard>
                          <AskAmmaPage />
                        </LockGuard>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <LockGuard>
                          <SettingsPage />
                        </LockGuard>
                      }
                    />
                    <Route
                      path="/settings/pin"
                      element={
                        <LockGuard>
                          <ChangePinPage />
                        </LockGuard>
                      }
                    />
                    <Route
                      path="/privacy"
                      element={
                        <LockGuard>
                          <PrivacyPage />
                        </LockGuard>
                      }
                    />

                    {/* 404 Friendly Page */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>

                {/* Global Bottom Navigation bar */}
                <BottomNav />
              </div>
            </AuthLockProvider>
          </UserAuthProvider>
        </ToastProvider>
      </I18nProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
