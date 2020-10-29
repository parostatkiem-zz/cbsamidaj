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


// app.delete("/api-rules", async (req, res) => {
//   const { name } = req.query;
//   const opts = {};
//   kubeconfig.applyToRequest(opts);
//   request.delete(`${apiRulesUrl}${name}`, opts, (error, response, body) => {
//     if (error) console.log(error);
//     res.sendStatus(200);
//   });
// // });

// console.log(kubeconfig.getUsers()[1].exec.args)
// console.log(kubeconfig.getUsers()[1].exec.args.join(' '))
// const currentContext = kubeconfig.getContexts()
//   .find(c => c.name === kubeconfig.getCurrentContext());
//   console.log(currentContext)
app.get("/pods", async (req, res) => {
  const ns = ['kyma-system', 'kube-system', 'default', 'kyma-installer'][Math.ceil(Math.random()*4)]


  const podsUrl = `${kubeconfig.getCurrentCluster().server
    }/api/v1/namespaces/${ns}/pods/`;
  
    
  const opts = {};
  kubeconfig.applyToRequest(opts);
  request.get(podsUrl, opts, (error, response, body) => {
    // todo return {data: data, error: error}
    if (error) {
      res.send(error);
    } else {
      res.send(JSON.parse(body).items);
    }
  });
});

// app.patch("/api-rules", async (req, res) => {
//   const { name, namespace, apiRule } = req.query;

//   const parameterizedApiRulesUrl = `${kubeconfig.getCurrentCluster().server
//     }/apis/gateway.kyma-project.io/v1alpha1/namespaces/${namespace}/apirules/${name}`;

//   const opts = {};
//   kubeconfig.applyToRequest(opts);
//   request.get(parameterizedApiRulesUrl, opts, (error, response, body) => {
//     const data = {
//       url: parameterizedApiRulesUrl,
//       body: apiRule ,
//       rejectUnauthorized: false,
//       headers: { "Content-type": 'application/merge-patch+json' },
//     };
//     kubeconfig.applyToRequest(data);

//     request.patch(data, (error, response, body) => {
//       if (error) {
//         res.send(error);
//       } else {
//         res.send(JSON.parse(body));
//       }
//     });
//   });
// });

const port = process.env.PORT || 3001;
const address = process.env.ADDRESS || "localhost";
server.listen(port, address, () => {
  console.log(`server started @ ${port}!`);
});
