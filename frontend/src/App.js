import React from "react";
import { useGet, useDelete, useUpdate } from "./api";

export default function App() {
  const { data: apiRules, loading, error, refetch } = useGet("api-rules"); //todo add generated keys
  const updateApiRuleMutation = useUpdate("api-rules", { refetch });
  const deleteApiRuleMutation = useDelete("api-rules", { refetch });

  const deleteApiRule = async ({ name, namespace }) => {
    try {
      await deleteApiRuleMutation({ name, namespace });
    } catch (e) {
      console.warn(e);
    }
  };

  const updateApiRule = async ({ name, namespace }) => {
    try {
      await updateApiRuleMutation({ name, namespace, newName: "kasia" });
    } catch (e) {
      console.warn(e);
    }
  };

  if (loading) return "Loading...";
  if (error) return error.message;
  if (!apiRules.length) return "Hm, pusto";

  return (
    <main>
      {apiRules.map(({ metadata, spec, status }) => (
        <details key={metadata.name}>
          <summary>
            {metadata.name} @ {metadata.namespace} [{status.APIRuleStatus.code}]
            <button onClick={() => deleteApiRule(metadata)}>Delete</button>
            <button onClick={() => updateApiRule(metadata)}>Update</button>
          </summary>
          <dl>
            <dt>Gateway</dt>
            <dd>{spec.gateway}</dd>
            <dt>Service Host</dt>
            <dd>{spec.service.host}</dd>
            <dt>Rules</dt>
            <ul>
              {spec.rules.map((r) => (
                <li key={r.path}>
                  <p>{r.path}</p>
                  <dl>
                    <dt>Type</dt>
                    <dd>{r.accessStrategies[0].handler}</dd>
                    <dt>Methods</dt>
                    <dd>{r.methods.join(", ")}</dd>
                  </dl>
                </li>
              ))}
            </ul>
          </dl>
        </details>
      ))}
    </main>
  );
}
