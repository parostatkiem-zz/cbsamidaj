const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const k8s = require("@kubernetes/client-node");
const request = require("request");

const server = express();
server.use(cors());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: false }));

// const httpServer = http.createServer(app);
// const io = socketIo(httpServer);

const kc = new k8s.KubeConfig();
kc.loadFromFile(process.env.KUBECONFIG);

const apiRulesUrl = `${
  kc.getCurrentCluster().server
}/apis/gateway.kyma-project.io/v1alpha1/namespaces/default/apirules/`;

server.delete("/api-rules", async (req, res) => {
  const { name } = req.query;
  const opts = {};
  kc.applyToRequest(opts);
  request.delete(`${apiRulesUrl}${name}`, opts, (error, response, body) => {
    if (error) console.log(error);
    res.sendStatus(200);
  });
});

server.get("/api-rules", async (req, res) => {
  const opts = {};
  kc.applyToRequest(opts);

  request.get(apiRulesUrl, opts, (error, response, body) => {
    // todo return {data: data, error: error}
    if (error) {
      res.send(error);
    } else {
      res.send(JSON.parse(body).items);
    }
  });
});

server.patch("/api-rules", async (req, res) => {
  const { name, namespace, newName } = req.query;
  const opts = {};
  kc.applyToRequest(opts);
  req.get(apiRulesUrl, opts, (error, response, body) => {
    const rule = JSON.parse(body).items[0];
    rule.metadata.name = newName;
    const opts = {
      headers: { "Content-type": 'application/json-merge-patch' },
    };
    console.log(rule);
    kc.applyToRequest(opts);
    const data = { url: `${apiRulesUrl}${name}`, body: JSON.stringify(rule) };
    console.log('tes')
    req.patch(data, opts, (error, response, body) => {
        if (error) console.log(error);
        else console.log('!')
        console.log(response);
        console.log(body);
        res.send('ok');
    });
  });
});

server.listen(3001, () => console.log("server started " + 3001));
