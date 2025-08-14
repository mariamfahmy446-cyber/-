
import { useState, useEffect, useCallback } from 'react';

function useLocalStorage<T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = useCallback<React.Dispatch<React.SetStateAction<T>>>((value) => {
    try {
      // To prevent race conditions with other tabs, we read the latest value
      // from localStorage just before we are about to set it. This ensures
      // that updates are based on the most current data, making the app's
      // state more consistent across different browser windows.
      const getLatestValue = (): T => {
        if (typeof window === 'undefined') {
          return initialValue;
        }
        try {
          const item = window.localStorage.getItem(key);
          return item ? JSON.parse(item) : initialValue;
        } catch (error) {
          console.error(`Error reading localStorage key “${key}”:`, error);
          return initialValue;
        }
      };
      
      const valueToStore = value instanceof Function ? value(getLatestValue()) : value;
      
      setStoredValue(valueToStore);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, initialValue]);

  const handleStorageChange = useCallback((event: StorageEvent) => {
    if (event.key !== key) {
        return;
    }
    if (event.newValue) {
        try {
            setStoredValue(JSON.parse(event.newValue));
        } catch (error) {
            console.error(`Error parsing new value for ${key} from storage event.`, error);
        }
    } else {
        // The item was removed from localStorage, reset to initial state
        setStoredValue(initialValue);
    }
  }, [key, initialValue]);

  useEffect(() => {
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [handleStorageChange]);
  
  return [storedValue, setValue];
}

export default useLocalStorage;