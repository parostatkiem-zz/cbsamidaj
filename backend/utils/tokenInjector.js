const injectTokenToOptions = (options, requestHeaders, kubeconfig) => {
  const token = requestHeaders.authorization;

  kubeconfig.applyAuthorizationHeader(options);

  return options;
};

export default injectTokenToOptions;
