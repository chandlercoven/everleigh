import '../styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import { PreferencesProvider } from '../lib/store';
import Script from 'next/script';
import ErrorBoundary from '../components/ErrorBoundary';
import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import type { Session } from 'next-auth';

// Extend AppProps to include the session
interface MyAppProps extends AppProps {
  pageProps: {
    session?: Session;
    [key: string]: any;
  }
}

function MyApp({ Component, pageProps }: MyAppProps) {
  const { session, ...restPageProps } = pageProps;
  
  // Add debug CSS to make sure all styles are applied
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Force CSS refresh
      const links = document.querySelectorAll('link[rel="stylesheet"]');
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
          const url = new URL(href, window.location.origin);
          const timestamp = String(Date.now());
          url.searchParams.set('t', timestamp);
          link.setAttribute('href', url.toString());
        }
      });

      console.log('Stylesheets refreshed:', links.length);
    }
  }, []);

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
      <ErrorBoundary>
        <PreferencesProvider>
          <SessionProvider session={session}>
            <Component {...restPageProps} />
          </SessionProvider>
        </PreferencesProvider>
      </ErrorBoundary>
    </>
  );
}

export default MyApp; 