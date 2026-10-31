import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Mascot } from './Mascot';
import { Button } from './Button';
import { RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FFF8EC] flex flex-col items-center justify-center p-6 text-center select-none font-sans text-warmBrown">
          <Mascot mood="alert" size={130} />
          <h2 className="text-2xl font-black text-warmBrown mt-4">
            ஏதோ தவறு நேர்ந்துவிட்டது அம்மா!
          </h2>
          <p className="text-sm font-semibold text-warmBrown-muted mt-2 max-w-xs leading-relaxed">
            பயப்படத் தேவையில்லை. உங்கள் தரவுகள் அனைத்தும் பாதுகாப்பாக உள்ளன.
          </p>

          <div className="flex flex-col gap-3 mt-6 w-full max-w-xs">
            <Button
              variant="primary"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/home';
              }}
              icon={<Home className="w-5 h-5" />}
            >
              முகப்புக்குச் செல்க (Go Home)
            </Button>

            <Button
              variant="ghost"
              onClick={() => window.location.reload()}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              மீண்டும் முயற்சிக்க (Reload)
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

