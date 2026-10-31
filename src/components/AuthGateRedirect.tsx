import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthLock } from '../lib/authLockContext';

export const AuthGateRedirect: React.FC = () => {
  const { isUnlocked, hasPin, hasLang } = useAuthLock();

  if (!hasLang) {
    return <Navigate to="/welcome" replace />;
  }

  if (!hasPin) {
    return <Navigate to="/setup-pin" replace />;
  }

  if (!isUnlocked) {
    return <Navigate to="/lock" replace />;
  }

  return <Navigate to="/home" replace />;
};

