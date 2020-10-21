import React, { useState, useRef } from 'react';
import { v4 as uuid } from 'uuid';
import accessStrategyTypes, {
  supportedMethodsList,
} from './accessStrategyTypes';

export function ApiRuleDetailsForm({ metadata, spec, updateApiRule }) {

  const [rules, setRules] = useState(spec.rules.map(r => ({ ...r, renderKey: uuid() })));

  function update(formValues) {
    const data = {
      spec: {
        rules: rules,
        gateway: formValues.spec.gateway.current.value || spec.gateway,
        service: {
          host: formValues.spec.service.host.current.value || spec.service.host,
          name: formValues.spec.service.name.current.value || spec.service.name,
          port: Number(formValues.spec.service.port.current.value) || spec.service.port,
        }
      }
    };

    updateApiRule({
      name: metadata.name,
      namespace: metadata.namespace,
      apiRule: JSON.stringify(data)
    });

  }

  const formValues = {
    name: useRef(null),
    spec: {
      gateway: useRef(null),
      service: {
        host: useRef(null),
        name: useRef(null),
        port: useRef(null),
      }
    },
  };
  return (
    <dl>
      <dt>Gateway</dt>
      <dd>
        <input
          id={`spec-gateway-${uuid()}`}
          defaultValue={spec.gateway}
          ref={formValues.spec.gateway}
          type="text"
        />
      </dd>
      <dt>Service Name</dt>
      <dd>
        <input
          id={`spec-service-name-${uuid()}`}
          defaultValue={spec.service.name}
          ref={formValues.spec.service.name}
          type="text"
        />
      </dd>
      <dt>Service Port</dt>
      <dd>
        <input
          id={`spec-service-port-${uuid()}`}
          defaultValue={spec.service.port}
          ref={formValues.spec.service.port}
          type="number"
        />
      </dd>
      <dt>Service Host</dt>
      <dd>
        <input
          id={`spec=service-host-${uuid()}`}
          defaultValue={spec.service.host}
          ref={formValues.spec.service.host}
          type="text"
        />
      </dd>
      <dt>Rules</dt>
      <ul>
        {!!rules.length &&
          rules.map((rule, idx) => {
            return (
              <StrategyForm
                key={rule.renderKey}
                strategy={rule}
                setStrategy={newStrategy => {
                  setRules(rules => [
                    ...rules.slice(0, idx),
                    newStrategy,
                    ...rules.slice(idx + 1, rules.length),
                  ]);

                }}

              />
            );
          })
        }
      </ul>
      <button onClick={() => update(formValues)}>Update</button>
    </dl>
  );
}
function StrategyForm({ strategy, setStrategy }) {
  console.log('strategy', strategy)

  const selectedType = strategy.accessStrategies[0].name;
  return (

    <li key={strategy.renderKey}>
      <p>Path</p>
      <input
        id={`strategy-path-${strategy.renderKey}`}
        placeholder="Enter the path"
        type="text"
        value={strategy.path}
        aria-label="Access strategy path"
        pattern="^[a-z0-9\/\(\)\?.!*\-]+"
        title="Path must consist of alphanumeric and the following characters: /.*?!-()"
        onChange={e =>
          setStrategy({ ...strategy, path: e.target.value })
        }
      />
      <dl>
        <dt>Type</dt>
        <dd>
          <select
            defaultValue={selectedType}
            aria-label="Access strategy type"
            id="select-1"
            onChange={e => {
              const newStrategy = {
                ...strategy,
                accessStrategies: [
                  {
                    ...strategy.accessStrategies[0],
                    handler: e.target.value,
                  },
                ],
              };

              if (e.target.value !== strategy.accessStrategies[0].handler) {
                newStrategy.accessStrategies[0].config = {};
              }
              setStrategy(newStrategy);

            }}
          >
            {Object.values(accessStrategyTypes).map(ac => (
              <option key={`${ac.value}-${strategy.renderKey}`} value={ac.value}>
                {ac.displayName}
              </option>
            ))}
          </select>
        </dd>

        <dt>Methods</dt>
        <MethodsForm
          methods={strategy.methods}
          setMethods={methods => setStrategy({ ...strategy, methods })}
          renderKey={strategy.renderKey}
        />

      </dl>
    </li>

  );
}

function MethodsForm({ methods, setMethods, renderKey }) {
  const AVAILABLE_METHODS = supportedMethodsList;
  const toggleMethod = function (method, checked) {
    if (checked) {
      setMethods([...methods, method]);
    } else {
      const removeIdx = methods.indexOf(method);
      setMethods([
        ...methods.slice(0, removeIdx),
        ...methods.slice(removeIdx + 1, methods.length),
      ]);
    }
  };
  return (

    AVAILABLE_METHODS.map((m, index) => (
      <dd key={`dd${m}-${renderKey}`}>
        <input type="checkbox"
          key={`${m}-${renderKey}`}
          id={`checkbox-${renderKey}-${index}`}
          value={m}
          defaultChecked={methods.includes(m)}
          onChange={e => toggleMethod(m, e.target.checked)}
        />
        <label key={`label-${m}-${renderKey}`} htmlFor={`checkbox-${index}`}>{m}</label>
      </dd>
    ))


  );
}
