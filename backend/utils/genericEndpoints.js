import injectTokenToOptions from "./tokenInjector";
import fetch from "node-fetch";
import { addJsonFieldToItems, calculateURL } from "./other";

export const createGenericGetEndpoint = (kubeconfig, app) => (
  path,
  urlTemplate,
  isNamespaced = true,
  extraItemHeader
) => {
  app.get(path, async (req, res) => {
    try {
      const opts = await injectTokenToOptions({}, req.headers, kubeconfig, app);
      const url = calculateURL(urlTemplate, {
        namespace: isNamespaced ? req.params.namespace : undefined,
      });

      console.log(opts);
      const response = await fetch(url, opts);

      if (!response.ok) {
        res.status(response.status);
        res.send(response.statusText);
        return;
      }

      const responseJSON = await response.json();
      addJsonFieldToItems(responseJSON, extraItemHeader);
      res.send(responseJSON);
    } catch (e) {
      console.error(e);
      res.status(500);
      res.send(e.message);
    }
  });
};

export const createGenericJsonUpdateEndpoint = (kubeconfig, app) => (
  path,
  urlTemplate,
  isNamespaced = true
) => {
  app.put(path, async (req, res) => {
    const { json } = req.body;
    const { name, namespace } = req.params;

    try {
      const opts = await injectTokenToOptions(
        {
          body: JSON.stringify(json),
        },
        req.headers,
        kubeconfig,
        app
      );

      const url = calculateURL(urlTemplate, { namespace: isNamespaced ? namespace : undefined, name });

      const response = await fetch(url, { method: "PUT", ...opts });
      res.send(response);
    } catch (e) {
      console.error(e);
      res.status(500);
      res.send(e.message);
    }
  });
};

export const createGenericDeleteEndpoint = (kubeconfig, app) => (path, urlTemplate, isNamespaced = true) => {
  app.delete(path, async (req, res) => {
    const { name, namespace } = req.params;

    try {
      const opts = await injectTokenToOptions({}, req.headers, kubeconfig, app);
      const url = calculateURL(urlTemplate, { namespace: isNamespaced ? namespace : undefined, name });

      const response = await fetch(url, { method: "DELETE", ...opts });
      res.send(response);
    } catch (e) {
      console.error(e);
      res.status(500);
      res.send(e.message);
    }
  });
};

export const createGenericSubscriptionEndpoint = (app) => (
  resourceType,
  urlTemplate,
  addJSONfield,
  JSONfieldExtraHeader
) => {
  const currentEndpoints = app.get("subscriptionEndpoints");
  app.set("subscriptionEndpoints", {
    ...currentEndpoints,
    [resourceType]: { urlTemplate, addJSONfield, JSONfieldExtraHeader },
  });
};
