import { useState, useEffect } from 'react';
import { USE_FAKE_BACKEND } from '../api/config';

/**
 * A utility component that allows toggling between fake and real backend.
 * This component is meant to be used during development only.
 * Place it in a corner of your app for easy access.
 */
const BackendToggle = () => {
  const [useFake, setUseFake] = useState(USE_FAKE_BACKEND);

  // Update the stored value when the toggle changes
  useEffect(() => {
    // This is a simple way to update the imported constant during runtime
    // Note that this isn't changing the actual config.js file
    window.USE_FAKE_BACKEND = useFake;
    localStorage.setItem('useFakeBackend', useFake);
    
    // Force a reload to apply the change
    if (useFake !== USE_FAKE_BACKEND) {
      window.location.reload();
    }
  }, [useFake]);

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        padding: '10px',
        background: '#f0f0f0',
        border: '1px solid #ccc',
        borderRadius: '5px',
        zIndex: 9999,
        fontSize: '12px'
      }}
    >
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="checkbox"
          checked={useFake}
          onChange={() => setUseFake(!useFake)}
        />
        Use Fake Backend: {useFake ? 'Yes' : 'No'}
      </label>
    </div>
  );
};

export default BackendToggle; 