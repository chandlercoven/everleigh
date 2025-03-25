import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function ErrorPage() {
  const router = useRouter();
  
  // Extract error message from query params
  const error = router.query.error;
  
  // Define common error messages
  const errorMessages = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "You do not have permission to access this resource.",
    Verification: "The verification link has expired or has already been used.",
    OAuthSignin: "Error in the OAuth sign-in process.",
    OAuthCallback: "Error in the OAuth callback process.",
    OAuthCreateAccount: "Could not create user in the OAuth provider.",
    EmailCreateAccount: "Could not create user - email may already be in use.",
    Callback: "Error in the callback handler.",
    OAuthAccountNotLinked: "The email associated with this sign-in method already exists with a different provider.",
    EmailSignin: "Check your email inbox for the sign-in link.",
    CredentialsSignin: "Invalid username or password.",
    SessionRequired: "Please sign in to access this page.",
    default: "An authentication error occurred."
  };
  
  // Get appropriate error message
  const errorMessage = error ? errorMessages[error] || errorMessages.default : errorMessages.default;

  return (
    <div className="error-container">
      <Head>
        <title>Authentication Error - Everleigh</title>
      </Head>

      <div className="error-card">
        <h1>Authentication Error</h1>
        <p className="error-message">{errorMessage}</p>
        
        <div className="actions">
          <Link href="/" className="home-button">
            Go to Home
          </Link>
          <Link href="/auth/signin" className="signin-button">
            Try Again
          </Link>
        </div>
      </div>

      <style jsx>{`
        .error-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 2rem;
          background-color: #f5f5f5;
        }
        
        .error-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          padding: 2rem;
          max-width: 500px;
          width: 100%;
          text-align: center;
        }
        
        h1 {
          color: #333;
          margin-bottom: 1rem;
        }
        
        .error-message {
          color: #e53e3e;
          margin-bottom: 2rem;
          font-size: 1.1rem;
        }
        
        .actions {
          display: flex;
          justify-content: center;
          gap: 1rem;
        }
        
        .home-button, .signin-button {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          text-decoration: none;
          transition: background-color 0.2s;
        }
        
        .home-button {
          background-color: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }
        
        .home-button:hover {
          background-color: #e5e7eb;
        }
        
        .signin-button {
          background-color: #4f46e5;
          color: white;
          border: none;
        }
        
        .signin-button:hover {
          background-color: #4338ca;
        }
      `}</style>
    </div>
  );
} 