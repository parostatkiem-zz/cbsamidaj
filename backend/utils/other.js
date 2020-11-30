export function addJsonFieldToItems(sourceJSON, extraHeader) {
  //TODO do this in a better way
  sourceJSON.items.forEach((item) => {
    addJsonField(item, extraHeader);
  });
}

export async function addJsonField(sourceJSON, extraHeader) {
  try {
    let jsonField = JSON.parse(JSON.stringify(sourceJSON));
    delete jsonField.status;
    if (extraHeader) jsonField = { ...extraHeader, ...jsonField };
    sourceJSON.json = jsonField;
  } catch (e) {
    console.error("Failed to add JSON field to an item", sourceJSON, e);
  }
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
