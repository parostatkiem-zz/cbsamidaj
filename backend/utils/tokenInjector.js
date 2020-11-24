import { validateToken } from "./tokenValidation";

const injectTokenToOptions = async (options, requestHeaders, kubeconfig, app) => {
  const username = await validateToken(requestHeaders.authorization, app);

  options.headers = { ...options.headers, "Impersonate-User": username };

  kubeconfig.applyAuthorizationHeader(options);

  return options;
};

export default injectTokenToOptions;
