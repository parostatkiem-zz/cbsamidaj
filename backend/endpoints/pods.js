import {
  createGenericGetEndpoint,
  createGenericDeleteEndpoint,
  createGenericJsonUpdateEndpoint,
  createGenericSubscriptionEndpoint,
} from "../utils/genericEndpoints";

export default function createPodEndpoints(kubeconfig, app) {
  createGenericGetEndpoint(kubeconfig, app)(
    "/namespaces/:namespace/pods",
    `${kubeconfig.getCurrentCluster().server}/api/v1/namespaces/{namespace}/pods`,
    true,
    { kind: "Pod", apiVersion: "v1" }
  );

  createGenericJsonUpdateEndpoint(kubeconfig, app)(
    "/namespaces/:namespace/pods/:name",
    `${kubeconfig.getCurrentCluster().server}/api/v1/namespaces/{namespace}/pods/{name}`
  );

  createGenericDeleteEndpoint(kubeconfig, app)(
    "/namespaces/:namespace/pods/:name",
    `${kubeconfig.getCurrentCluster().server}/api/v1/namespaces/{namespace}/pods/{name}`
  );

  createGenericSubscriptionEndpoint(app)(
    "pods",
    `${kubeconfig.getCurrentCluster().server}/api/v1/namespaces/{namespace}/pods?watch=true`,
    true,
    {
      kind: "Pod",
      apiVersion: "v1",
    }
  );
}
