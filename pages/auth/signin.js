import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function SignIn() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  
  // Redirect if already authenticated
  if (status === 'authenticated') {
    router.push('/');
    return null;
  }

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
} 