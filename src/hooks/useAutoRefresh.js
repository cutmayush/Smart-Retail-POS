import { useEffect, useRef } from 'react';

function useAutoRefresh(refresh, intervalMs = 30000) {
  const refreshRef = useRef(refresh);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        refreshRef.current();
      }
    };
    const intervalId = window.setInterval(refreshWhenVisible, intervalMs);

    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [intervalMs]);
}

export default useAutoRefresh;
