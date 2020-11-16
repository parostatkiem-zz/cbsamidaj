const express = require("express");
const socketIO = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const SubscriptionPool = require("./SubscriptionPool");

import { initializeKubeconfig } from "./utils/kubeconfig";
import createPodEndpoints from "./endpoints/pods";

const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: "*" })); //TODO
const kubeconfig = initializeKubeconfig();
const server = http.createServer(app);
const io = socketIO(server, { transports: ["websocket", "polling"] });
app.set("subscriptionEndpoints", {});
createPodEndpoints(kubeconfig, app);

new SubscriptionPool(io, kubeconfig, app.get("subscriptionEndpoints"));

const port = process.env.PORT || 3001;
const address = process.env.ADDRESS || "localhost";
console.log(`Domain used: ${kubeconfig.getCurrentCluster().name}`);
server.listen(port, address, () => {
  console.log(`SCALP server started @ ${port}!`);
});
