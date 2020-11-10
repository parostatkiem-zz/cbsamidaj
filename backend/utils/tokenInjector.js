const injectTokenToOptions = (options, requestObject, kubeconfig) => {
  const token = requestObject.headers.authorization;
  // kubeconfig.applyToRequest(options); //TODO wyjebac?

  return {
    ...options,
    headers: { ...(options.headers || {}), Authorization: token },
  };
};

export default injectTokenToOptions;
