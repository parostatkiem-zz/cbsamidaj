import { validateToken } from "./tokenValidation";

const injectHeaders = async (baseOptions, requestHeaders, kubeconfig, app) => {
  const username = await validateToken(requestHeaders.authorization, app);

  baseOptions.headers = { ...baseOptions.headers, "Impersonate-User": username };

  kubeconfig.applyAuthorizationHeader(baseOptions);

  return baseOptions;
};

export default injectHeaders;
