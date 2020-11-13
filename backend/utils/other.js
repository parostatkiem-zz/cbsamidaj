export function addJsonFieldToItems(sourceJSON, extraHeader) {
  //TODO do this in a better way
  sourceJSON.items.forEach((item) => {
    let jsonField = JSON.parse(JSON.stringify(item));
    delete jsonField.status;
    if (extraHeader) jsonField = { ...extraHeader, ...jsonField };
    item.json = jsonField;
  });
}

export const calculateURL = (template, variables) => {
  let output = template;
  Object.entries(variables).forEach(([key, value]) => {
    if (value === undefined) return;
    output = output.replace(`{${key}}`, value);
  });
  if (~output.indexOf("{")) throw new Error("Not every variable supplied for template " + template);
  return output;
};
