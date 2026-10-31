import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { DesignSystemScreen } from '../screens/DesignSystemScreen';
import { useI18n } from '../i18n/i18nContext';

export const DesignSystemPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-[#FFF8EC] flex flex-col">
      <TopBar
        title={t('designSystem.title')}
        subtitle="Pongal Warmth UI Tokens"
        showBack={true}
        onBack={() => navigate('/home')}
      />
      <div className="flex-1">
        <DesignSystemScreen />
      </div>
    </div>
  );
};

