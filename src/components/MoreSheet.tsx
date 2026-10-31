import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  PieChart,
  HelpCircle,
  Settings,
  Palette,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { BottomSheet } from './BottomSheet';

interface MoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MoreSheet: React.FC<MoreSheetProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n();
  const navigate = useNavigate();

  const menuItems = [
    {
      id: 'scam-shield',
      label: t('moreSheet.scamShield'),
      path: '/scam-shield',
      icon: ShieldAlert,
      color: 'bg-red-100 text-danger',
    },
    {
      id: 'insights',
      label: t('moreSheet.insights'),
      path: '/insights',
      icon: PieChart,
      color: 'bg-leafGreen-light text-leafGreen',
    },
    {
      id: 'ask',
      label: t('moreSheet.askAmma'),
      path: '/ask',
      icon: HelpCircle,
      color: 'bg-turmeric-100 text-turmeric-dark',
    },
    {
      id: 'settings',
      label: t('moreSheet.settings'),
      path: '/settings',
      icon: Settings,
      color: 'bg-cream-dark text-warmBrown',
    },
    {
      id: 'privacy',
      label: t('privacy.title'),
      path: '/privacy',
      icon: ShieldCheck,
      color: 'bg-leafGreen-light text-leafGreen',
    },
    {
      id: 'design',
      label: t('moreSheet.design'),
      path: '/design',
      icon: Palette,
      color: 'bg-kumkum-100 text-kumkum',
    },
  ];

  const handleSelect = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t('moreSheet.title')}>
      <div className="flex flex-col gap-2 py-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.path)}
              className="p-3.5 rounded-2xl bg-white hover:bg-cream border border-[#EFEBE9] flex items-center justify-between active:scale-[0.99] transition-all shadow-warm-sm"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm sm:text-base font-extrabold text-warmBrown text-left">
                  {item.label}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-warmBrown-subtle" />
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
};

