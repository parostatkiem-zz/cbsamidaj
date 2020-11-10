import injectTokenToOptions from "./tokenInjector";
import fetch from "node-fetch";

function addJsonFieldToItems(sourceJSON) {
  //TODO do this in a better way
  sourceJSON.items.forEach((item) => {
    const jsonField = JSON.parse(JSON.stringify(item));
    delete jsonField.status;
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
  isNamespaced = true
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
      addJsonFieldToItems(responseJSON);
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
  resourceUrlFragments,
  isNamespaced = true
) => {
  app.patch(path, async (req, res) => {
    const { name, namespace, json } = req.body;

    const url = calculateURL([...resourceUrlFragments], isNamespaced, namespace);

    const a = { headers: { "Content-type": "application/merge-patch+json" }, body: json };

    const opts = injectTokenToOptions(a, req, kubeconfig);

    try {
      const response = await fetch(url, { method: "POST", ...opts });

      if (!response.ok) {
        res.status(response.status);
        res.send(response.statusText);
        return;
      }

      const responseJSON = await response.json();
      console.log(responseJSON);
    } catch (e) {
      console.error(e);
      res.status(500);
      res.send(e.message);
    }
  });
};
