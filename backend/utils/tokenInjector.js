const injectTokenToOptions = (options, requestObject, kubeconfig) => {
  const token = requestObject.headers.authorization;

  kubeconfig.applyToRequest(options);

  return {
    headers: { ...(options.headers || {}), Authorization: token },
  };
};

export default injectTokenToOptions;
