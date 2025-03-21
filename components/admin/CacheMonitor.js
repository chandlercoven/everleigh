import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

const CacheMonitor = () => {
  const { data: session } = useSession();
  const [cacheStats, setCacheStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionResult, setActionResult] = useState(null);

  // Check if user has admin role
  const isAdmin = session?.user?.role === 'admin';

  // Fetch cache statistics
  const fetchCacheStats = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/cache');
      
      if (!response.ok) {
        throw new Error('Failed to fetch cache statistics');
      }
      
      const data = await response.json();
      setCacheStats(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Perform cache action (flush or delete key)
  const performCacheAction = async (action, key = null) => {
    setActionResult(null);
    
    try {
      const payload = { action };
      if (key) {
        payload.key = key;
      }
      
      const response = await fetch('/api/admin/cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error('Failed to perform cache action');
      }
      
      const data = await response.json();
      setActionResult({ success: true, message: data.message });
      
      // Refresh the stats
      fetchCacheStats();
    } catch (err) {
      setActionResult({ success: false, message: err.message });
    }
  };

  // Fetch stats on component mount
  useEffect(() => {
    if (isAdmin) {
      fetchCacheStats();
    }
  }, [isAdmin]);

  // If not an admin, don't render the component
  if (!isAdmin) {
    return <div className="alert alert-warning">Admin access required</div>;
  }

  return (
    <div className="cache-monitor">
      <h2>Cache Monitor</h2>
      
      {isLoading && <div className="loading">Loading cache statistics...</div>}
      
      {error && (
        <div className="error">
          Error: {error}
          <button onClick={fetchCacheStats}>Retry</button>
        </div>
      )}
      
      {actionResult && (
        <div className={`action-result ${actionResult.success ? 'success' : 'error'}`}>
          {actionResult.message}
        </div>
      )}
      
      {cacheStats && (
        <div className="stats-container">
          <div className="stats-summary">
            <h3>Cache Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">Keys</div>
                <div className="stat-value">{cacheStats.keyCount}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Hits</div>
                <div className="stat-value">{cacheStats.stats.hits}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Misses</div>
                <div className="stat-value">{cacheStats.stats.misses}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Hit Rate</div>
                <div className="stat-value">
                  {cacheStats.stats.hits + cacheStats.stats.misses === 0
                    ? '0%'
                    : `${Math.round(
                        (cacheStats.stats.hits /
                          (cacheStats.stats.hits + cacheStats.stats.misses)) *
                          100
                      )}%`}
                </div>
              </div>
            </div>
            
            <div className="actions">
              <button
                className="flush-button"
                onClick={() => performCacheAction('flush')}
              >
                Flush All Cache
              </button>
              <button
                className="refresh-button"
                onClick={fetchCacheStats}
              >
                Refresh Statistics
              </button>
            </div>
          </div>
          
          {cacheStats.keys.length > 0 && (
            <div className="cache-keys">
              <h3>Cache Keys ({cacheStats.keyCount} total, showing first 100)</h3>
              <ul className="key-list">
                {cacheStats.keys.map((key) => (
                  <li key={key} className="key-item">
                    <span className="key-name">{key}</span>
                    <button
                      className="delete-key"
                      onClick={() => performCacheAction('delete', key)}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      <style jsx>{`
        .cache-monitor {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }
        
        h2 {
          margin-top: 0;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 0.75rem;
          margin-bottom: 1.5rem;
        }
        
        .loading, .error {
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }
        
        .loading {
          background-color: #f0f9ff;
          color: #0c5460;
        }
        
        .error {
          background-color: #f8d7da;
          color: #721c24;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .error button {
          background-color: #dc3545;
          color: white;
          border: none;
          padding: 0.375rem 0.75rem;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .action-result {
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }
        
        .action-result.success {
          background-color: #d4edda;
          color: #155724;
        }
        
        .action-result.error {
          background-color: #f8d7da;
          color: #721c24;
        }
        
        .stats-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .stats-summary {
          background-color: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 1rem;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .stat-item {
          padding: 0.75rem;
          background-color: #f0f9ff;
          border-radius: 6px;
          text-align: center;
        }
        
        .stat-label {
          font-size: 0.875rem;
          color: #6c757d;
          margin-bottom: 0.25rem;
        }
        
        .stat-value {
          font-size: 1.25rem;
          font-weight: bold;
          color: #0d6efd;
        }
        
        .actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
        }
        
        .actions button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .flush-button {
          background-color: #dc3545;
          color: white;
        }
        
        .refresh-button {
          background-color: #0d6efd;
          color: white;
        }
        
        .cache-keys {
          background-color: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 1rem;
        }
        
        .key-list {
          list-style: none;
          padding: 0;
          margin: 0;
          max-height: 300px;
          overflow-y: auto;
        }
        
        .key-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          border-bottom: 1px solid #f0f0f0;
          font-family: monospace;
          font-size: 0.875rem;
        }
        
        .key-item:last-child {
          border-bottom: none;
        }
        
        .key-name {
          word-break: break-all;
        }
        
        .delete-key {
          background-color: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          cursor: pointer;
          margin-left: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default CacheMonitor; 