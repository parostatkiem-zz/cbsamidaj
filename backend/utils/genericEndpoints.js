import injectTokenToOptions from "./tokenInjector";
import fetch from "node-fetch";

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

export const createGenericJsonUpdateEndpoint = (kubeconfig, app) => (
  path,
  resourceUrlFragments,
  isNamespaced = true
) => {
  app.patch(path, async (req, res) => {
    const { name, namespace, json } = req.body;

    const opts = injectTokenToOptions(
      {
        rejectUnauthorized: false,
        body: JSON.stringify(json),
        headers: {
          "content-type": "application/json",
        },
      },
      req,
      kubeconfig
    );

    try {
      const url = calculateURL([...resourceUrlFragments], isNamespaced, namespace) + "/" + name; //todo

      const response = await fetch(url, { method: "PUT", ...opts });
      res.send(response);
    } catch (e) {
      console.error(e);
      res.status(500);
      res.send(e.message);
    }
  });
};
