import { SessionProvider } from 'next-auth/react';
import ErrorBoundary from '../components/ErrorBoundary';
import '../styles/globals.css';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <ErrorBoundary>
      <SessionProvider session={session}>
        <Component {...pageProps} />
      </SessionProvider>
    </ErrorBoundary>
  );
}

export default MyApp; 