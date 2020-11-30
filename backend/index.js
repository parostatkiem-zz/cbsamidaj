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

new SubscriptionPool(io, kubeconfig, app);

initializeApp(app, kubeconfig);

// keep the error handlers as the last routes added to the app
app.use(function (req, res, next) {
  res.status(404).send("URL " + req.url + " not found");
});
app.use(function (err, req, res, next) {
  console.error(err);
  res.status(500).sent("Internal server error");
});

const port = process.env.PORT || 3001;
const address = process.env.ADDRESS || "localhost";
console.log(`Domain used: ${kubeconfig.getCurrentCluster().name}`);
server.listen(port, address, () => {
  console.log(`👙 PAMELA 👄  server started @ ${port}!`);
});
