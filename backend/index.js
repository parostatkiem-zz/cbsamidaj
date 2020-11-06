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
app.use(cors({ origin: "http://localhost:3001" }));
const server = http.createServer(app);
const io = socketIO(server);

const kubeconfig = initializeKubeconfig();

new SubscriptionPool(io, kubeconfig);
createPodEndpoints(kubeconfig, app);

// const apiRulesUrl = `${kubeconfig.getCurrentCluster().server}/api/v1/namespaces/kyma-system`;

// app.delete("/api-rules", async (req, res) => {
//   const { name } = req.query;
//   const opts = {};
//   kubeconfig.applyToRequest(opts);
//   // request.delete(`${apiRulesUrl}${name}`, opts, (error, response, body) => {
//   //   if (error) console.log(error);
//   //   res.sendStatus(200);
//   // });
// });

// app.patch("/api-rules", async (req, res) => {
//   const { name, namespace, apiRule } = req.query;

//   const parameterizedApiRulesUrl = `${
//     kubeconfig.getCurrentCluster().server
//   }/apis/gateway.kyma-project.io/v1alpha1/namespaces/${namespace}/apirules/${name}`;

//   const opts = {};
//   kubeconfig.applyToRequest(opts);

//   // request.get(parameterizedApiRulesUrl, opts, (error, response, body) => {
//   //   const data = {
//   //     url: parameterizedApiRulesUrl,
//   //     body: apiRule,
//   //     rejectUnauthorized: false,
//   //     headers: { "Content-type": "application/merge-patch+json" },
//   //   };
//   //   kubeconfig.applyToRequest(data);

//   //   request.patch(data, (error, response, body) => {
//   //     if (error) {
//   //       res.send(error);
//   //     } else {
//   //       res.send(JSON.parse(body));
//   //     }
//   //   });
//   // });
// });

const port = process.env.PORT || 3001;
const address = process.env.ADDRESS || "localhost";
server.listen(port, address, () => {
  console.log(`server started @ ${port}!`);
});
