const k8s = require("@kubernetes/client-node");

class Subscription {

  get hasNoSubscribers() {
    return !Object.keys(this._subscribers).length;
  }

  // https://github.com/kubernetes-client/javascript/issues/377 ?
  constructor(resourceType, kubeconfig) {
    this._subscribers = {};

    const watch = new k8s.Watch(kubeconfig); // todo only one instance per SubscriptionPool?
    watch
      .watch(
        resourceType,
        {},
        (type, apiObj, _watchObj) => this.notify({ type, object: apiObj }),
        console.log
      )
      .then((req) => (this.controller = req));
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
  constructor(io, kc) {
    this.io = io;
    this.subscriptions = {};

    io.on("connection", (socket) => {
      const resource = socket.handshake.query.resource;
      const resourceType = this.mapResource(resource);

      if (!this.subscriptions[resourceType]) {
        this.subscriptions[resourceType] = new Subscription(resourceType, kc);
      }
      this.subscriptions[resourceType].addSubscriber(socket);

      socket.on("disconnect", () => {
        this.subscriptions[resourceType].removeSubscriber(socket)
        if (this.subscriptions[resourceType].hasNoSubscribers) {
          delete this.subscriptions[resourceType];
        }
      });
    });
  }

  // todo namespace, error handling
  mapResource(resource) {
    return {
      "api-rules":
        "/apis/gateway.kyma-project.io/v1alpha1/namespaces/default/apirules",
    }[resource];
  }
}

module.exports = SubscriptionPool;
