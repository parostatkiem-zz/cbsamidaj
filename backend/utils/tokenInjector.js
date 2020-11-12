const injectTokenToOptions = (options, requestObject, kubeconfig) => {
  const token = requestObject.headers.authorization;

  return {
    ...options,
    headers: { ...(options.headers || {}), Authorization: token },
  };
};

export default injectTokenToOptions;
