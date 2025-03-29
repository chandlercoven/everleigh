import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

// Client-side only component to handle router-dependent logic
const SignInClient = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  
  // Redirect if already authenticated
  if (status === 'authenticated') {
    router.push('/');
    return null;
  }

  useEffect(() => {
    // Function to detect circular references in the URL
    const detectAndFixRecursion = () => {
      // Get the current URL's query parameters
      const { callbackUrl } = router.query;
      
      if (!callbackUrl) return;
      
      // Check if the callbackUrl contains /auth/signin, indicating recursion
      if (callbackUrl.includes('/auth/signin')) {
        console.log('[Auth] Detected recursive callbackUrl:', callbackUrl);
        
        // Replace the URL with one without the recursive parameter
        router.replace('/auth/signin', undefined, { shallow: true });
        
        // Log this issue for monitoring
        try {
          fetch('/api/auth-monitor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: window.location.href,
              baseUrl: window.location.origin,
              referrer: document.referrer,
              redirectResult: 'Detected and prevented recursion'
            })
          });
        } catch (err) {
          console.error('[Auth] Error logging redirect issue:', err);
        }
      }
    };
    
    detectAndFixRecursion();
  }, [router]);

  const handleCredentialsChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const result = await signIn('credentials', {
      redirect: false,
      email: credentials.email,
      password: credentials.password
    });
    
    if (result.error) {
      setError('Invalid email or password');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="auth-container">
      <h1>Sign In to Everleigh</h1>
      
      {error && (
        <div className="error-message">{error}</div>
      )}
      
      <form onSubmit={handleCredentialsSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={credentials.email}
            onChange={handleCredentialsChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={credentials.password}
            onChange={handleCredentialsChange}
            required
          />
        </div>
        
        <button type="submit" className="sign-in-button">
          Sign In with Email
        </button>
      </form>
      
      <div className="auth-divider">
        <span>OR</span>
      </div>
      
      <button
        className="google-button"
        onClick={() => signIn('google', { callbackUrl: '/' })}
      >
        Sign in with Google
      </button>
      
      <style jsx>{`
        .auth-container {
          max-width: 400px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        h1 {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .error-message {
          background-color: #ffebee;
          color: #d32f2f;
          padding: 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }
        
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        input {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .sign-in-button, .google-button {
          padding: 0.75rem;
          border: none;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .sign-in-button {
          background-color: #0070f3;
          color: white;
        }
        
        .sign-in-button:hover {
          background-color: #005ccc;
        }
        
        .auth-divider {
          display: flex;
          align-items: center;
          margin: 1.5rem 0;
        }
        
        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #ddd;
        }
        
        .auth-divider span {
          padding: 0 10px;
          color: #666;
        }
        
        .google-button {
          background-color: #4285f4;
          color: white;
        }
        
        .google-button:hover {
          background-color: #3367d6;
        }
      `}</style>
    </div>
  );
};

// Dynamic import for client-side router code
const SignInClientSide = dynamic(() => Promise.resolve(SignInClient), { ssr: false });

export default function SignIn() {
  const { data: session, status } = useSession();
  
  // Server-side check for authenticated state
  if (status === 'authenticated') {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    return null;
  }

  // Show loading state during session check
  if (status === 'loading') {
    return (
      <div className="auth-loading flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render client-side component when not authenticated
  return <SignInClientSide />;
} 