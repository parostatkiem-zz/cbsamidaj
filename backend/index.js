const express = require("express");
const socketIO = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const SubscriptionPool = require("./SubscriptionPool");

import { initializeKubeconfig } from "./utils/kubeconfig";
import createPodEndpoints from "./endpoints/pods";
import { initializeApp } from "./utils/initialization";

const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: "*" })); //TODO
const kubeconfig = initializeKubeconfig();
const server = http.createServer(app);
const io = socketIO(server, { transports: ["websocket", "polling"] });
app.set("subscriptionEndpoints", {});
createPodEndpoints(kubeconfig, app);

new SubscriptionPool(io, kubeconfig, app.get("subscriptionEndpoints"));

initializeApp(app, kubeconfig); //todo

app.use(function (req, res, next) {
  // the status option, or res.statusCode = 404
  // are equivalent, however with the option we
  // get the "status" local available as well
  res.status(404).send("URL " + req.url + " not found");
});

// error-handling middleware, take the same form
// as regular middleware, however they require an
// arity of 4, aka the signature (err, req, res, next).
// when connect has an error, it will invoke ONLY error-handling
// middleware.

// If we were to next() here any remaining non-error-handling
// middleware would then be executed, or if we next(err) to
// continue passing the error, only error-handling middleware
// would remain being executed, however here
// we simply respond with an error page.

app.use(function (err, req, res, next) {
  // we may use properties of the error object
  // here and next(err) appropriately, or if
  // we possibly recovered from the error, simply next().
  console.error(err);
  res.status(500).sent("Internal server error");
});

const port = process.env.PORT || 3001;
const address = process.env.ADDRESS || "localhost";
console.log(`Domain used: ${kubeconfig.getCurrentCluster().name}`);
server.listen(port, address, () => {
  console.log(`👙 PAMELA 👄  server started @ ${port}!`);
});
