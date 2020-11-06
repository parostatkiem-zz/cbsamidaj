const express = require("express");
const socketIO = require("socket.io");
const cors = require("cors");

const bodyParser = require("body-parser");
const k8s = require("@kubernetes/client-node");
const fetch = require("node-fetch");
const http = require("http");
const SubscriptionPool = require("./SubscriptionPool");

import { generateKubeconfigString } from "./utils/kubeconfig";

const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: "http://localhost:3000" }));
const server = http.createServer(app);
const io = socketIO(server);

const kubeconfig = new k8s.KubeConfig();

kubeconfig.loadFromString(generateKubeconfigString(process.env));

new SubscriptionPool(io, kubeconfig);

const apiRulesUrl = `${kubeconfig.getCurrentCluster().server}/api/v1/namespaces/kyma-system`;

app.delete("/api-rules", async (req, res) => {
  const { name } = req.query;
  const opts = {};
  kubeconfig.applyToRequest(opts);
  // request.delete(`${apiRulesUrl}${name}`, opts, (error, response, body) => {
  //   if (error) console.log(error);
  //   res.sendStatus(200);
  // });
});

app.get("/api-rules", async (req, res) => {
  const token = req.headers.authorization;

  const opts = {};

  kubeconfig.applyToRequest(opts);

  opts.headers.Authorization = token;

  try {
    const response = await fetch(apiRulesUrl, { method: "GET", ...opts });

    // console.log("res", response.statusText);
    if (!response.ok) {
      res.status(response.status);
      res.send(response.statusText);
      return;
    }
    //asd
    const json = await response.json();
    res.send(json);
  } catch (e) {
    res.status(500);
    res.send(e.message);
  }
});

app.patch("/api-rules", async (req, res) => {
  const { name, namespace, apiRule } = req.query;

  const parameterizedApiRulesUrl = `${
    kubeconfig.getCurrentCluster().server
  }/apis/gateway.kyma-project.io/v1alpha1/namespaces/${namespace}/apirules/${name}`;

  const opts = {};
  kubeconfig.applyToRequest(opts);

  // request.get(parameterizedApiRulesUrl, opts, (error, response, body) => {
  //   const data = {
  //     url: parameterizedApiRulesUrl,
  //     body: apiRule,
  //     rejectUnauthorized: false,
  //     headers: { "Content-type": "application/merge-patch+json" },
  //   };
  //   kubeconfig.applyToRequest(data);

  //   request.patch(data, (error, response, body) => {
  //     if (error) {
  //       res.send(error);
  //     } else {
  //       res.send(JSON.parse(body));
  //     }
  //   });
  // });
});

const port = process.env.PORT || 3001;
const address = process.env.ADDRESS || "localhost";
server.listen(port, address, () => {
  console.log(`server started @ ${port}!`);
});
