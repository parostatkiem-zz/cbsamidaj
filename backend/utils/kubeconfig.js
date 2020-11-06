export function generateKubeconfigString(env) {
  const { DOMAIN } = env;
  return `apiVersion: v1
clusters:
- cluster:
    server: https://apiserver.${DOMAIN}
  name: ${DOMAIN}
contexts:
- context:
    cluster: ${DOMAIN}
    user: OIDCUser
  name: ${DOMAIN}
current-context: ${DOMAIN}
kind: Config
preferences: {}
users:
- name: OIDCUser
  user:
    token: to_be_replaced`;
}
