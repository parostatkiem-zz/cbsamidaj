import { validateToken } from "./tokenValidation";

const injectTokenToOptions = async (options, requestHeaders, kubeconfig, app) => {
  validateToken(requestHeaders.authorization, app);

  kubeconfig.applyAuthorizationHeader(options);

  return options;
};

export default injectTokenToOptions;
