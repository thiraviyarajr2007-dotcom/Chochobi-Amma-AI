import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { Mascot } from '../components/Mascot';
import { Button } from '../components/Button';
import { KolamMotif } from '../components/KolamMotif';

export const NotFoundPage: React.FC = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FFF8EC] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden select-none">
      <div className="absolute -top-10 -right-10 pointer-events-none opacity-20">
        <KolamMotif size={180} color="#C2185B" />
      </div>
      <div className="absolute -bottom-10 -left-10 pointer-events-none opacity-15">
        <KolamMotif size={160} color="#FFB300" />
      </div>

      <div className="z-10 flex flex-col items-center max-w-sm">
        <Mascot mood="alert" size={130} animate={true} />

        <span className="text-4xl font-black text-kumkum mt-4">404</span>

        <h1 className="text-xl sm:text-2xl font-black text-warmBrown mt-1">
          {lang === 'ta' ? 'பக்கம் கிடைக்கவில்லை' : 'Page Not Found'}
        </h1>

        <p className="text-xs sm:text-sm font-semibold text-warmBrown-muted mt-2 leading-relaxed">
          {lang === 'ta'
            ? 'மன்னிக்கவும் அம்மா, நீங்கள் தேடும் பக்கம் இங்கு இல்லை அல்லது மாற்றப்பட்டுவிட்டது.'
            : 'Sorry Amma, the page you are looking for does not exist or has been moved.'}
        </p>

        <div className="mt-6 flex flex-col gap-3 w-full">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/home')}
            icon={<Home className="w-5 h-5" />}
          >
            {lang === 'ta' ? 'முகப்புக்கு செல்' : 'Go to Home'}
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate(-1)}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            {t('common.back')}
          </Button>
        </div>
      </div>
    </div>
  );
};

