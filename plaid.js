module.exports = function (RED) {
  const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid");
  ("use strict");
  function PlaidCredentialNode(n) {
    RED.nodes.createNode(this, n);
  }

  RED.nodes.registerType("plaid-credentials", PlaidCredentialNode, {
    credentials: {
      secret: { type: "password" },
      client_id: { type: "password" },
    },
  });

  function PlaidItemCredentialNode(n) {
    RED.nodes.createNode(this, n);
    this.bank = n.bank;
    this.item_id = n.item_id;
    this.env = n.env;
  }

  RED.nodes.registerType("plaid-item-credentials", PlaidItemCredentialNode, {
    credentials: {
      access_token: { type: "password" },
    },
  });

  class PlaidApiNode {
    constructor(config) {
      RED.nodes.createNode(this, config);
      var node = this;
      this.plaidCreds = RED.nodes.getNode(config.plaid).credentials;
      const { client_id, secret } = this.plaidCreds;

      const { env, item_id, credentials } = RED.nodes.getNode(config.item);
      const { access_token } = credentials;

      if (client_id && secret && item_id) {
        const config = new Configuration({
          basePath: PlaidEnvironments[env],
          baseOptions: {
            headers: {
              "PLAID-CLIENT-ID": client_id,
              "PLAID-SECRET": secret,
              "Plaid-Version": "2020-09-14",
            },
          },
        });
        this.client = new PlaidApi(config);
      } else {
        this.status({
          fill: "red",
          shape: "ring",
          text: "Credentials missing",
        });
      }

      node.on("input", function (msg) {
        if (!secret) {
          this.status({
            fill: "red",
            shape: "ring",
            text: "Api Secret missing",
          });
        }
        if (!access_token) {
          this.status({
            fill: "red",
            shape: "ring",
            text: `Access Token missing`,
          });
        }

        this.client.accountsBalanceGet({
          access_token,
        }).then((balanceResponse)=>{
          node.send({ payload: balanceResponse.data });
        })
      });
    }
  }
  RED.nodes.registerType("plaid-api", PlaidApiNode);
};
