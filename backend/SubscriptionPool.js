import { Watch } from "@kubernetes/client-node";
import { calculateURL } from "./utils/other";

class Subscription {
  get hasNoSubscribers() {
    return !Object.keys(this._subscribers).length;
  }

  // https://github.com/kubernetes-client/javascript/issues/377 ?
  constructor(resourceType, kubeconfig, token) {
    this._subscribers = {};

    // kubeconfig.applyToRequest({ headers: { Authorization: token } });
    kubeconfig.users[0].token = token;
    const watcher = new Watch(kubeconfig); // todo only one instance per SubscriptionPool?

    watcher
      .watch(
        resourceType,
        {},
        (type, apiObj, _watchObj) => {
          console.log("got event", type);
          this.notify({ type, object: apiObj });
        },
        console.error
      )
      .then((req) => (this.controller = req))
      .catch((e) => console.error("error", e));
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
      socket.emit("Piotrek");

      const { resource, idToken: token, ...otherParams } = socket.handshake.query; //TODO avoid encoding other params in the URL
      const resourceType = this.mapResource(resource, otherParams);

      if (!resourceType) throw new Error("Client tried to subscribe to an unknown resource " + resource);
      // console.log("trying to subscribe to", resource);

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

  // // todo namespace, error handling
  // mapResource(resource) {
  //   return {
  //     "api-rules": "/apis/gateway.kyma-project.io/v1alpha1/namespaces/default/apirules",
  //   }[resource];
  // }
  mapResource(resource, templateVariables) {
    return calculateURL(this.subscriptions[resource], templateVariables);
  }
}

module.exports = SubscriptionPool;
