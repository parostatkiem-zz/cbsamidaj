import injectTokenToOptions from "./tokenInjector";
import fetch from "node-fetch";
import { loadYaml, CoreV1Api, dumpYaml } from "@kubernetes/client-node";

function addJsonFieldToItems(sourceJSON, extraHeader) {
  //TODO do this in a better way
  sourceJSON.items.forEach((item) => {
    let jsonField = JSON.parse(JSON.stringify(item));
    delete jsonField.status;
    if (extraHeader) jsonField = { ...extraHeader, ...jsonField };
    item.json = jsonField;
  });
}

const calculateURL = (fragments, isNamespaced, namespace) => {
  if (isNamespaced) fragments.splice(1, 0, `namespaces`, namespace);
  return fragments.join("/");
};

export const createGenericGetEndpoint = (kubeconfig, app) => (
  path,
  resourceUrlFragments,
  isNamespaced = true,
  extraItemHeader
) => {
  app.get(path, async (req, res) => {
    const opts = injectTokenToOptions({}, req, kubeconfig);

    try {
      const url = calculateURL([...resourceUrlFragments], isNamespaced, req.params.namespaceId);

      const response = await fetch(url, { method: "GET", ...opts });

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

export const createGenericJsonUpdateEndpoint = (kubeconfig, app) => (path) => {
  app.patch(path, async (req, res) => {
    const { name, namespace, json } = req.body;
    const opts = injectTokenToOptions({}, req, kubeconfig);
    const u = kubeconfig.getCurrentUser();
    u.token = opts.headers.Authorization.slice(7, opts.headers.Authorization.length);
    kubeconfig.users = [u];
    const k8sApi = kubeconfig.makeApiClient(CoreV1Api);

    try {
      const responseJSON = await k8sApi.replaceNamespacedPod(name, namespace, json);
      // console.log(responseJSON);
      res.send(responseJSON.response.request);
    } catch (e) {
      res.status(e.response?.body?.code || 500);
      res.send(e.response?.body?.message || e.message);
    }
  });
};
