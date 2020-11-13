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

const calculateURL = (template, variables) => {
  let output = template;
  Object.entries(variables).forEach(([key, value]) => {
    if (value === undefined) return;
    output = output.replace(`{${key}}`, value);
  });
  if (~output.indexOf("{")) throw new Error("Not every variable supplied for template " + template);
  return output;
};

export const createGenericGetEndpoint = (kubeconfig, app) => (
  path,
  urlTemplate,
  isNamespaced = true,
  extraItemHeader
) => {
  app.get(path, async (req, res) => {
    const opts = injectTokenToOptions({}, req, kubeconfig);

    try {
      const url = calculateURL(urlTemplate, {
        namespace: isNamespaced ? req.params.namespace : undefined,
      });

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
  urlTemplate,
  isNamespaced = true
) => {
  app.patch(path, async (req, res) => {
    const { json } = req.body;
    const { name, namespace } = req.params;

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
