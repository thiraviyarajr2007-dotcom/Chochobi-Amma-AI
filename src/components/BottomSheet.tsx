import React, { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxHeight?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxHeight = 'max-h-[85vh]',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-warmBrown/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Container */}
      <div
        className={`relative z-10 w-full max-w-[460px] bg-white rounded-t-4xl sm:rounded-4xl p-6 shadow-warm-lg border border-[#EFEBE9] flex flex-col ${maxHeight} overflow-y-auto animate-fade-in`}
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-[#D7CCC8] rounded-full mx-auto mb-4 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EFEBE9] mb-4">
          {title && (
            <h2 className="text-xl font-bold text-warmBrown tracking-tight">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="w-10 h-10 ml-auto rounded-full bg-cream hover:bg-cream-dark flex items-center justify-center text-warmBrown active:scale-95 transition-transform"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

