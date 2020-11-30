import { calculateURL, addJsonField } from "./utils/other";
import injectHeaders from "./utils/headerInjector";
import byline from "byline";
import fetch from "node-fetch";

class Subscription {
  get hasNoSubscribers() {
    return !Object.keys(this._subscribers).length;
  }

  // https://github.com/kubernetes-client/javascript/issues/377 ?
  constructor() {
    this._subscribers = [];
  }

  notify(data) {
    for (const subscriber of Object.values(this._subscribers)) {
      subscriber.send(data);
    }
  }

  async addSubscriber(socket, resourceURL, configForResource, injectHeadersFn) {
    const opts = await injectHeadersFn({});

    let errOut = null;
    const stream = byline.createStream();

    stream.on("data", (line) => {
      const data = JSON.parse(line);

      const createdAt = data.object?.metadata?.creationTimestamp;
      if (data.type === "ADDED" && createdAt && new Date(createdAt) < new Date()) return; // risky but I like to risk; skip ADDED type events bombing right after the subscription has been opened

      if (configForResource.addJSONfield && data?.object)
        addJsonField(data.object, configForResource.JSONfieldExtraHeader);
      this.notify(data);
    });
    stream.on("error", (err) => {
      errOut = err;
    });
    stream.on("close", () => (errOut = new Error("Stream closed unexpectedly")));

    const resp = await fetch(resourceURL, { method: "GET", ...opts });

    new Promise((resolve, reject) => {
      resp.body.pipe(stream);
      this.controller = stream;
      stream.on("close", () => resolve());
      stream.on("error", reject);
    }).catch(console.error);

    if (errOut) throw errOut;

    this._subscribers[socket.id] = socket;
  }

  removeSubscriber(socket) {
    delete this._subscribers[socket.id];

    if (this.hasNoSubscribers && this.controller) {
      this.controller.destroy();
    }
  }
}

class SubscriptionPool {
  constructor(io, kc, app) {
    this.io = io;
    this.subscriptions = app.get("subscriptionEndpoints");

    io.on("connection", (socket) => {
      const { resource, authorization, ...otherParams } = socket.handshake.query; //TODO avoid encoding other params in the URL (no idea how)
      const configForResource = this.subscriptions[resource];

      if (!configForResource) {
        console.error("Client tried to subscribe to an unknown resource:", resource);
        return;
      }

      const resourceURL = this.getURLForResource(resource, otherParams);

      if (!this.subscriptions[resourceURL]) {
        this.subscriptions[resourceURL] = new Subscription();
      }

      const agent = app.get("https_agent");

      const injectHeadersFn = (baseOpts) => injectHeaders({ agent, ...baseOpts }, { authorization }, kc, app);

      this.subscriptions[resourceURL]
        .addSubscriber(socket, resourceURL, configForResource, injectHeadersFn) // add subscriber asynchronously
        .catch((e) => {
          console.error("Failed to add subscriber for resource", resource, e);
        });

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
