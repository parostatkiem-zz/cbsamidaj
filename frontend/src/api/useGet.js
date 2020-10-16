import React from "react";
import { baseUrl } from "./config";

export function useGet(resourceType, onDataReceived) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const refetch = React.useCallback(
    async () => {
      setLoading(true);
      try {
        const response = await fetch(baseUrl + resourceType);
        if (!response.ok) throw Error(response.statusText);
        const payload = await response.json();
        if (typeof onDataReceived === 'function') onDataReceived(payload);
        setData(payload);
      } catch (e) {
        setError(e);
      }
      setLoading(false);
    },
    [resourceType, onDataReceived]
  );

  React.useEffect(() => {
    refetch();
  }, [resourceType, refetch]);

  return { data, loading, error, refetch };
}
