import injectTokenToOptions from "./tokenInjector";
import fetch from "node-fetch";

export const createGenericGetEndpoint = (kubeconfig, app) => (
  path,
  resourceUrlFragments,
  isNamespaced = false
) => {
  app.get(path, async (req, res) => {
    const opts = injectTokenToOptions({}, req, kubeconfig);

    try {
      if (isNamespaced) resourceUrlFragments.splice(1, 0, `namespaces`, req.params.namespaceId);

      const response = await fetch(resourceUrlFragments.join("/"), { method: "GET", ...opts });

      if (!response.ok) {
        res.status(response.status);
        res.send(response.statusText);
        return;
      }

      const json = await response.json();
      res.send(json);
    } catch (e) {
      res.status(500);
      res.send(e.message);
    }
  });
};
