export function handleSubscriptionEvent(setResource) {
  const filterByName = obj => entry => entry.metadata.name !== obj.metadata.name;

  return (data) => {
    const { type, object } = data;
    switch (type) {
      case "ADDED":
        setResource((resource) => [...resource, object]);
        break;
      case "DELETED":
        setResource((resource) => resource.filter(filterByName(object)));
        break;
      case "MODIFIED":
        setResource((resource) =>
          resource.map((r) => (filterByName(object)(r) ? r : object)) // fancy
        );
        break;
      default:
        console.log(data);
        break;
    }
  };
}
