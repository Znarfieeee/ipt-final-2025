// Get the saved preference from localStorage or use default (false)
const getSavedBackendPreference = () => {
  const saved = localStorage.getItem('useFakeBackend');
  return saved !== null ? saved === 'true' : false;
};

export let USE_FAKE_BACKEND = getSavedBackendPreference();

// Allow runtime changes to this value
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'USE_FAKE_BACKEND', {
    get: () => USE_FAKE_BACKEND,
    set: (value) => {
      USE_FAKE_BACKEND = value;
    }
  });
}
