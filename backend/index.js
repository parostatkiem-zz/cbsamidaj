const express = require("express");
const socketIO = require("socket.io");
const cors = require("cors");

const bodyParser = require("body-parser");
const k8s = require("@kubernetes/client-node");
const request = require("request");
const http = require("http");
const SubscriptionPool = require('./SubscriptionPool')

const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: "http://localhost:3000" }));
const server = http.createServer(app);
const io = socketIO(server);

const kubeconfig = new k8s.KubeConfig();
kubeconfig.loadFromFile(process.env.KUBECONFIG);

new SubscriptionPool(io, kubeconfig);

const apiRulesUrl = `${kubeconfig.getCurrentCluster().server
  }/apis/gateway.kyma-project.io/v1alpha1/namespaces/default/apirules/`;

app.delete("/api-rules", async (req, res) => {
  const { name } = req.query;
  const opts = {};
  kubeconfig.applyToRequest(opts);
  request.delete(`${apiRulesUrl}${name}`, opts, (error, response, body) => {
    if (error) console.log(error);
    res.sendStatus(200);
  });
});

app.get("/api-rules", async (req, res) => {
  const opts = {};
  kubeconfig.applyToRequest(opts);

  request.get(apiRulesUrl, opts, (error, response, body) => {

    // todo return {data: data, error: error}
    if (error) {
      res.send(error);
    } else {
      res.send(JSON.parse(body).items);
    }
  });
});

app.patch("/api-rules", async (req, res) => {
  const { name, namespace, apiRule } = req.query;

  const parameterizedApiRulesUrl = `${kubeconfig.getCurrentCluster().server
    }/apis/gateway.kyma-project.io/v1alpha1/namespaces/${namespace}/apirules/${name}`;

  const opts = {};
  kubeconfig.applyToRequest(opts);
  request.get(parameterizedApiRulesUrl, opts, (error, response, body) => {
    const data = {
      url: parameterizedApiRulesUrl,
      body: apiRule ,
      rejectUnauthorized: false,
      headers: { "Content-type": 'application/merge-patch+json' },
    };
    kubeconfig.applyToRequest(data);

    request.patch(data, (error, response, body) => {
      if (error) {
        res.send(error);
      } else {
        res.send(JSON.parse(body));
      }
    });
  });
});

const port = process.env.PORT || 3001;
const address = process.env.ADDRESS || "localhost";
server.listen(port, address, () => {
  console.log(`server started @ ${port}!`);
});
