import { Watch } from "@kubernetes/client-node";
import { calculateURL } from "./utils/other";

class Subscription {
  get hasNoSubscribers() {
    return !Object.keys(this._subscribers).length;
  }

  // https://github.com/kubernetes-client/javascript/issues/377 ?
  constructor(resourceType, kubeconfig, token) {
    this._subscribers = {};
    kubeconfig.users[0].token = token;

    const watcher = new Watch(kubeconfig); // todo only one instance per SubscriptionPool?

    watcher
      .watch(
        resourceType,
        {},
        (type, apiObj, _watchObj) => {
          if (
            type === "ADDED" &&
            apiObj.metadata?.creationTimestamp &&
            new Date(apiObj.metadata.creationTimestamp) < new Date()
          )
            return; // risky but I like to risk; skip ADDED type events bombing right after the subscription has been opened
          this.notify({ type, object: apiObj });
        },
        console.error
      )
      .then((req) => (this.controller = req))
      .catch(console.error);
  }

  notify(data) {
    for (const subscriber of Object.values(this._subscribers)) {
      subscriber.send(data);
    }
  }

  addSubscriber(socket) {
    this._subscribers[socket.id] = socket;
  }

  removeSubscriber(socket) {
    delete this._subscribers[socket.id];

    if (this.hasNoSubscribers) {
      this.controller.abort();
    }
  }
}

class SubscriptionPool {
  constructor(io, kc, subscriptionEndpoints) {
    this.io = io;
    this.subscriptions = subscriptionEndpoints;

    io.on("connection", (socket) => {
      const { resource, idToken: token, ...otherParams } = socket.handshake.query; //TODO avoid encoding other params in the URL
      const resourceType = this.mapResource(resource, otherParams);

      if (!resourceType) throw new Error("Client tried to subscribe to an unknown resource " + resource);

      if (!this.subscriptions[resourceType]) {
        this.subscriptions[resourceType] = new Subscription(resourceType, kc, token);
      }
      this.subscriptions[resourceType].addSubscriber(socket);

      socket.on("disconnect", () => {
        this.subscriptions[resourceType].removeSubscriber(socket);
        if (this.subscriptions[resourceType].hasNoSubscribers) {
          delete this.subscriptions[resourceType];
        }
      });
    });
  }

  mapResource(resource, templateVariables) {
    return calculateURL(this.subscriptions[resource], templateVariables);
  }
}

module.exports = SubscriptionPool;
