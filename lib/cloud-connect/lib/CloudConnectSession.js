const logger = require("winston");
const AWS = require("aws-sdk");

class CloudConnectSession {
  constructor(manifest, invoke) {
    this.invoke = invoke;
    this.manifest = manifest;
    this.credentials = null;
    this.account = null;
  }

  login(username, password) {
    return this._getCredentials(null)
      .then((credentials) => {
        this.credentials = credentials;
        return this.invoke("AuthLambda", "LOGIN", { userName: username, password });
      })
      .then((account) => {
        this.account = account;
        return this._getCredentials(account.credentials.token)
      })
      .then((credentials) => {
        this.credentials = credentials;
      })
  }

  refreshCredentials() {
    logger.debug("refreshCredentials");

    if (!this.account.credentials.refreshToken) {
      throw new Error("No Refresh Token", this.account, this.credentials);
    }

    this.credentials = new AWS.CognitoIdentityCredentials({
       IdentityPoolId: this.manifest.IdentityPool
    });

    this.credentials.clearCachedId();

    return this.invoke("AuthLambda", "REFRESH", { refreshToken: this.account.credentials.refreshToken })
      .then((account) => {
        this.account = account;
        return this._getCredentials(this.account.credentials.token);
      }).then((credentials) => {
        this.credentials = credentials;
        return Promise.resolve(credentials);
      });
  }

  _getCredentials(token) {
    let credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: this.manifest.IdentityPool,
      Logins: {
        [`cognito-idp.${this.manifest.Region}.amazonaws.com/${this.manifest.UserPool}`]: token
      }
    });

    return new Promise((resolve, reject) => { credentials.get((err) => { err ? reject(err) : resolve(credentials) }) });
  }
}

module.exports = CloudConnectSession;
