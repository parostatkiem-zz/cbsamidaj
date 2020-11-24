import { KubeConfig } from "@kubernetes/client-node";

export function initializeKubeconfig() {
  const kubeconfigLocation = process.env.KUBECONFIG;

  const kubeconfig = new KubeConfig();

  if (kubeconfigLocation) kubeconfig.loadFromFile(kubeconfigLocation);
  else kubeconfig.loadFromCluster();

  // console.log("Using the following Kubeconfig: ", kubeconfig.exportConfig());

  return kubeconfig;
}
