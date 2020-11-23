import injectTokenToOptions from "./tokenInjector";
import fetch from "node-fetch";
import { addJsonFieldToItems, calculateURL } from "./other";
import { CoreV1Api } from "@kubernetes/client-node";

function decodeJWT(token) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const buff = new Buffer(base64, "base64");
  const payloadinit = buff.toString("ascii");
  const payload = JSON.parse(payloadinit);
  return payload;
}

export const createGenericGetEndpoint = (kubeconfig, app) => (
  path,
  urlTemplate,
  isNamespaced = true,
  extraItemHeader
) => {
  const k8sApi = kubeconfig.makeApiClient(CoreV1Api);

  app.get(path, async (req, res) => {
    const opts = injectTokenToOptions({}, req.headers, kubeconfig);

    try {
      const url = calculateURL(urlTemplate, {
        namespace: isNamespaced ? req.params.namespace : undefined,
      });

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

    const opts = injectTokenToOptions(
      {
        body: JSON.stringify(json),
      },
      req.headers,
      kubeconfig
    );

    try {
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
    const opts = injectTokenToOptions({}, req.headers, kubeconfig);

    try {
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
