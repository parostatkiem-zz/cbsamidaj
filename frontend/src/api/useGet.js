import React from "react";
import { baseUrl } from "./config";

export function useGet(resourceType) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const refetch = React.useCallback(
    async () => {
      setLoading(true);
      try {
        const response = await fetch(baseUrl + resourceType);
        if (!response.ok) throw Error(response.statusText);
        setData(await response.json());
      } catch (e) {
        setError(e);
      }
      setLoading(false);
    },
    [resourceType]
  );

  React.useEffect(() => {
    refetch();
  }, [resourceType, refetch]);

  return { data, loading, error, refetch };
}
