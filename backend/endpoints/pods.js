import { createGenericGetEndpoint, createGenericJsonUpdateEndpoint } from "../utils/genericEndpoints";

export default function createPodEndpoints(kubeconfig, app) {
  createGenericGetEndpoint(kubeconfig, app)(
    "/namespaces/:namespaceId/pods",
    [`${kubeconfig.getCurrentCluster().server}/api/v1`, `pods`],
    true,
    { kind: "Pod", apiVersion: "v1" }
  );

  createGenericJsonUpdateEndpoint(kubeconfig, app)("/namespaces/:namespaceId/pods", [
    `${kubeconfig.getCurrentCluster().server}/api/v1`,
    `pods`,
  ]);
}
