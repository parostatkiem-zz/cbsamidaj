import { Watch } from "@kubernetes/client-node";
import { calculateURL, addJsonField } from "./utils/other";
import injectTokenToOptions from "./utils/tokenInjector";
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

  async addSubscriber(socket, resourceURL, configForResource, kubeconfig, injectHeadersFn) {
    const opts = await injectHeadersFn({});
    // const watcher = new Watch(kubeconfig); // todo only one instance per SubscriptionPool?

    const stream = byline.createStream();
    stream.on("data", (line) => {
      const data = JSON.parse(line);
      if (configForResource.addJSONfield) addJsonField(data.object, configForResource.JSONfieldExtraHeader);
      this.notify(data);
    });

    let errOut = null;
    stream.on("error", (err) => {
      console.log("stream error", err);
    });
    stream.on("close", () => console.log("stream closed"));

    fetch(resourceURL + "?watch=true", { method: "GET", ...opts })
      .then(
        (r) =>
          new Promise((resolve, reject) => {
            const dest = stream;
            r.body.pipe(dest);
            dest.on("close", () => resolve());
            dest.on("error", reject);
          })
      )
      .catch((e) => {
        console.error("catch", e);
      })
      .then((a) => console.log("resolved finaly", a));
    // req.pipe(stream);
    // watcher
    //   .watch(
    //     resourceURL,
    //     {},
    //     (type, apiObj, _watchObj) => {
    //       console.log(type, apiobj);
    //       if (
    //         type === "ADDED" &&
    //         apiObj.metadata?.creationTimestamp &&
    //         new Date(apiObj.metadata.creationTimestamp) < new Date()
    //       )
    //         return; // risky but I like to risk; skip ADDED type events bombing right after the subscription has been opened

    //       if (configForResource.addJSONfield) addJsonField(apiObj, configForResource.JSONfieldExtraHeader);
    //       this.notify({ type, object: apiObj });
    //     },
    //     console.error
    //   )
    //   .then((req) => (this.controller = req))
    //   .catch(console.error);

    this._subscribers[socket.id] = socket;
  }

  removeSubscriber(socket) {
    delete this._subscribers[socket.id];

    if (this.hasNoSubscribers) {
      // this.controller.abort();
    }
  }
}

class SubscriptionPool {
  constructor(io, kc, app) {
    this.io = io;
    this.subscriptions = app.get("subscriptionEndpoints");

    io.on("connection", (socket) => {
      const { resource, authorization, ...otherParams } = socket.handshake.query; //TODO avoid encoding other params in the URL
      const configForResource = this.subscriptions[resource];

      if (!configForResource) {
        console.error("Client tried to subscribe to an unknown resource:", resource);
        return;
      }

      const injectHeadersFn = (baseOpts) => injectTokenToOptions(baseOpts, { authorization }, kc, app);
      const resourceURL = this.getURLForResource(resource, otherParams);

      if (!this.subscriptions[resourceURL]) {
        this.subscriptions[resourceURL] = new Subscription();
      }
      this.subscriptions[resourceURL].addSubscriber(
        socket,
        resourceURL,
        configForResource,
        kc,
        injectHeadersFn
      );

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
