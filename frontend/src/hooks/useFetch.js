import { useState, useEffect, useCallback } from 'react';

/**
 * useFetch — Generic hook for data fetching with loading/error state.
 * @param {Function} fetchFn - Async function to call.
 * @param {Array} deps - Effect dependencies.
 * @returns {{ data, loading, error, refetch }}
 */
const useFetch = (fetchFn, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    execute();
  }, [...deps, execute]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch: execute };
};

export default useFetch;
