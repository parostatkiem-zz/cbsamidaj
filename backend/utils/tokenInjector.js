const injectTokenToOptions = (options, requestObject, kubeconfig) => {
  const token = requestObject.headers.authorization;

  kubeconfig.applyToRequest(options);
  //   opts.headers.Authorization = token;
  return {
    headers: { ...(options.headers || {}), Authorization: token },
  };
};

export default injectTokenToOptions;
