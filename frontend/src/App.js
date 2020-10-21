import React from "react";
import { useGet, useDelete, useUpdate, useSubscription } from "./api";
import { handleSubscriptionEvent } from "./handleSubscriptionEvent";
import { ApiRuleDetailsForm } from "./ApiRuleDetailsForm/ApiRuleDetailsForm";


function ApiRuleContent({ metadata, spec, status, deleteApiRule, updateApiRule }) {

  const [edit, setEdit] = React.useState(false);
  return (
    <details key={metadata.name}>
      <summary>
        {metadata.name} @ {metadata.namespace} [{status?.APIRuleStatus.code}]
        <button onClick={() => deleteApiRule(metadata)}>Delete</button>
        {!edit && <button onClick={() => setEdit(true)}>Edit</button>}
        {edit && <button onClick={() => setEdit(false)}>Cancel</button>}
      </summary>
      {!edit &&
        <ApiRuleDetails spec={spec} />}
      {edit &&
        <ApiRuleDetailsForm metadata={metadata} spec={spec} edit={edit} updateApiRule={updateApiRule} />}
    </details>
  );
}
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

  const updateApiRule = async ({ name, namespace, apiRule }) => {
    try {
      await updateApiRuleMutation({ name, namespace, apiRule });
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
        <ApiRuleContent metadata={metadata} spec={spec} status={status} deleteApiRule={deleteApiRule} updateApiRule={updateApiRule} />
      ))}
    </main>
  );
}
