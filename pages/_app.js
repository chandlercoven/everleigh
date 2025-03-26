import '../styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import { PreferencesProvider } from '../lib/store';
import Script from 'next/script';
import ErrorBoundary from '../components/ErrorBoundary';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
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
            <Component {...pageProps} />
          </SessionProvider>
        </PreferencesProvider>
      </ErrorBoundary>
    </>
  );
}

export default MyApp; 