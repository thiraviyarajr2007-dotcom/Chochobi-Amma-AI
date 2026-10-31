import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthLock } from '../lib/authLockContext';

interface LockGuardProps {
  children?: React.ReactNode;
}

export const LockGuard: React.FC<LockGuardProps> = ({ children }) => {
  const { isUnlocked, hasPin, hasLang, lockApp } = useAuthLock();
  const location = useLocation();

  // If no language chosen, redirect to welcome
  if (!hasLang) {
    return <Navigate to="/welcome" replace />;
  }

  // If no PIN set, redirect to setup-pin
  if (!hasPin) {
    return <Navigate to="/setup-pin" replace />;
  }

  // If locked, save current deep link and redirect to /lock
  if (!isUnlocked) {
    const requested = location.pathname + location.search;
    lockApp(requested);
    return <Navigate to="/lock" replace />;
  }

  return children ? <>{children}</> : null;
};

