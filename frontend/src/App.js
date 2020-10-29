import React from "react";
import { useGet, useDelete, useUpdate, useSubscription } from "./api";
import { handleSubscriptionEvent } from "./handleSubscriptionEvent";


export default function App() {
  const [pods, setPods] = React.useState([]);
  const { loading, error } = useGet("pods", setPods);
  // const updateApiRuleMutation = useUpdate("pods");
  const deleteApiRuleMutation = useDelete("pods");

  // useSubscription(
  //   "pods",
  //   React.useCallback(handleSubscriptionEvent(setPods), [])
  // );

  // const deleteApiRule = async ({ name, namespace }) => {
  //   try {
  //     await deleteApiRuleMutation({ name, namespace });
  //   } catch (e) {
  //     console.warn(e);
  //   }
  // };

  // const updateApiRule = async ({ name, namespace, apiRule }) => {
  //   try {
  //     await updateApiRuleMutation({ name, namespace, apiRule });
  //   } catch (e) {
  //     console.warn(e);
  //   }
  // };


  if (loading) return "Loading...";
  if (error) return error.message;
  if (!pods.length) return "Hm, pusto";

  return (
    <main>
      {pods.map(({ metadata }) => (
        <div key={metadata.name}>{metadata.name}</div>
      ))}
    </main>
  );
}
