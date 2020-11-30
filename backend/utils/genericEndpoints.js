import injectHeaders from "./headerInjector";
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
      const agent = app.get("https_agent");
      const opts = await injectHeaders({ agent }, req.headers, kubeconfig, app);
      const url = calculateURL(urlTemplate, {
        namespace: isNamespaced ? req.params.namespace : undefined,
      });

      const response = await fetch(url, opts);

      if (!response.ok) {
        console.warn(
          `Request to ${url} ended with error. Message: ${response.message} Status: ${response.status}`
        );
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
      const agent = app.get("https_agent");
      const opts = await injectHeaders(
        {
          agent,
          body: JSON.stringify(json),
          headers: {
            "content-type": "application/strategic-merge-patch+json",
          },
        },
        req.headers,
        kubeconfig,
        app
      );

      const url = calculateURL(urlTemplate, { namespace: isNamespaced ? namespace : undefined, name });

      const response = await fetch(url, { method: "PATCH", ...opts });
      if (!response.ok) throw new Error("Failed to update resource " + name);
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
      const agent = app.get("https_agent");
      const opts = await injectHeaders({ agent }, req.headers, kubeconfig, app);
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
