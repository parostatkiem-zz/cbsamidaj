import React from "react";
import { useGet, useDelete, useUpdate, useSubscription } from "./api";
import { handleSubscriptionEvent } from "./handleSubscriptionEvent";

function ApiRuleDetails({ spec }) {
  return (
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
  );
}

export default function App() {
  const [apiRules, setApiRules] = React.useState([]);
  const { loading, error } = useGet("api-rules", setApiRules);
  const updateApiRuleMutation = useUpdate("api-rules");
  const deleteApiRuleMutation = useDelete("api-rules");

  useSubscription(
    "api-rules",
    React.useCallback(handleSubscriptionEvent(setApiRules), [])
  );

  const deleteApiRule = async ({ name, namespace }) => {
    try {
      await deleteApiRuleMutation({ name, namespace });
    } catch (e) {
      console.warn(e);
    }
  };

  const updateApiRule = async ({ name, namespace }) => {
    try {
      await updateApiRuleMutation({ name, namespace, newHost: "newHost" });
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
            {metadata.name} @ {metadata.namespace} [{status?.APIRuleStatus.code}]
            <button onClick={() => deleteApiRule(metadata)}>Delete</button>
            <button onClick={() => updateApiRule(metadata)}>Update</button>
          </summary>
          <ApiRuleDetails spec={spec} />
        </details>
      ))}
    </main>
  );
}
