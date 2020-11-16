import { Watch } from "@kubernetes/client-node";
import { calculateURL, addJsonField } from "./utils/other";

class Subscription {
  get hasNoSubscribers() {
    return !Object.keys(this._subscribers).length;
  }

  // https://github.com/kubernetes-client/javascript/issues/377 ?
  constructor(resourceURL, configForResource, kubeconfig, token) {
    this._subscribers = {};
    kubeconfig.users[0].token = token;

    const watcher = new Watch(kubeconfig); // todo only one instance per SubscriptionPool?

    watcher
      .watch(
        resourceURL,
        {},
        (type, apiObj, _watchObj) => {
          if (
            type === "ADDED" &&
            apiObj.metadata?.creationTimestamp &&
            new Date(apiObj.metadata.creationTimestamp) < new Date()
          )
            return; // risky but I like to risk; skip ADDED type events bombing right after the subscription has been opened

          if (configForResource.addJSONfield) addJsonField(apiObj, configForResource.JSONfieldExtraHeader);
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
      const configForResource = this.subscriptions[resource];

      if (!configForResource) throw new Error("Client tried to subscribe to an unknown resource " + resource);

      const resourceURL = this.getURLForResource(resource, otherParams);

      if (!this.subscriptions[resourceURL]) {
        this.subscriptions[resourceURL] = new Subscription(resourceURL, configForResource, kc, token);
      }
      this.subscriptions[resourceURL].addSubscriber(socket);

      socket.on("disconnect", () => {
        this.subscriptions[resourceURL].removeSubscriber(socket);
        if (this.subscriptions[resourceURL].hasNoSubscribers) {
          delete this.subscriptions[resourceURL];
        }
      });
    });
  }

  getURLForResource(resource, templateVariables) {
    if (!this.subscriptions[resource]) return;
    return calculateURL(this.subscriptions[resource].urlTemplate, templateVariables);
  }
}

module.exports = SubscriptionPool;
