import { useEffect, useState } from 'react';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

// reCAPTCHA v3 Site Key (invisible)
export const RECAPTCHA_SITE_KEY = '6Lfd1_8rAAAAAA0wO5G6TdtDFIB82EtS1Y9-jgCt';

export function useRecaptcha() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Проверяем что мы на клиенте
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Check if reCAPTCHA script is already loaded
    if (window.grecaptcha) {
      window.grecaptcha.ready(() => {
        setIsReady(true);
      });
      return;
    }

    // Load reCAPTCHA v3 script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => {
          setIsReady(true);
        });
      } else {
        console.error('[reCAPTCHA] Script loaded but grecaptcha not available');
      }
    };

    script.onerror = (error) => {
      console.error('[reCAPTCHA] Failed to load script:', error);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script if component unmounts
      if (typeof document !== 'undefined') {
        const scriptElements = document.querySelectorAll(`script[src*="recaptcha"]`);
        scriptElements.forEach((el) => el.remove());
      }
    };
  }, []);

  const executeRecaptcha = async (action: string = 'game_start'): Promise<string | null> => {
    if (!isReady || !window.grecaptcha) {
      console.error('[reCAPTCHA] Not ready - isReady:', isReady, 'grecaptcha:', !!window.grecaptcha);
      return null;
    }

    try {
      const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
      return token;
    } catch (error) {
      console.error('[reCAPTCHA] Failed to execute:', error);
      return null;
    }
  };

  return {
    isReady,
    executeRecaptcha,
  };
}

