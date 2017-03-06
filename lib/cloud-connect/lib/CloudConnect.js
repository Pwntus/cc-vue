const request = require("request");
const EventEmitter = require("events");
const AWSIot = require("aws-iot-device-sdk");
const AWS = require("aws-sdk");

const logger = require("./logger");
const Session = require("./CloudConnectSession");

class CloudConnect extends EventEmitter {
  constructor(opts) {
    super();

    this.opts = opts;
    this.session = null;
    this.manifestUrl = "https://1u31fuekv5.execute-api.eu-west-1.amazonaws.com/prod/manifest"
  }

  init() {
    logger.info("CloudConnect._init");
    const { account, env, username, password } = this.opts;
    const that = this;
    return this._getManifest(account, env)
      .then((manifest) => {
        AWS.config.region = manifest.Region;
        this.manifest = manifest;
        this.session = new Session(manifest, this.invoke.bind(this));
        logger.debug('-----------------------');
        logger.debug('---- Account :' + account + ', env :' + env);
        // logger.debug('---- manifest: ');
        // logger.debug(manifest);
        logger.debug('-----------------------');
        return this.session.login(username, password);
      })
      .then(() => that._initMqtt(that.session.credentials, that.manifest))
      .catch((err) => {
        logger.error("CloudConnect._init", err)
        return Promise.reject()
      })
  }

  publish(topic, payload) {
    console.log(this.mqtt);
    // this.mqtt.publish(topic, payload);
  }

  invoke(endpoint, action, attributes) {
    logger.debug("CloudConnect.invoke" , endpoint, action); // attributes);

    const invokeAsync = () => {
      return new Promise((resolve, reject) => {
        this._invoke(endpoint, action, attributes, resolve, reject);
      });
    }

    return invokeAsync()
      .catch((error) => {
        if (this._isAuthError(error)) {
          return this.session.refreshCredentials()
            .then(this._updateWebsocketCredentials(this.session.credentials))
            .then(invokeAsync)
            //.catch(logout);   // restart app one way or another
        } else {
          logger.error(`-- invoke lambda error: `, endpoint, ".", action, JSON.stringify(attributes)); //, error); // eslint-disable-line
          throw error;
        }
      });
  }

  _invoke(endpoint, action, attributes, resolve, reject) {
    const FunctionName = this.session.manifest[endpoint];
    const Payload = attributes.query ?
      JSON.stringify({ action, query: attributes.query }) :
      JSON.stringify({ action, attributes });
    logger.info({Payload});
    if (!FunctionName) {
      return reject("Unknown manifest endpoint: " + endpoint)
    }

    return this.lambda().invoke({ FunctionName, Payload }, (err, res) => {
      try {
        if (err) {
          reject(this._parseError(err));
        } else if (!res || !res.Payload) {
          reject("No data");
        } else {
          const payload = JSON.parse(res.Payload);
          if (res.FunctionError || payload.errorMessage) {
            reject(this._parseError(payload));
          } else {
            resolve(payload);
          }
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  lambda() {
    return new AWS.Lambda({ credentials: this.session.credentials });
  }

  s3() {
    return new AWS.S3({ credentials: this.session.credentials });
  }

  _initMqtt({ accessKeyId, secretAccessKey, sessionToken }) {
    let mqtt = AWSIot.device({
      region: AWS.config.region,
      protocol: "wss",
      maximumReconnectTimeMs: 8000,
      accessKeyId,
      secretKey: secretAccessKey,
      sessionToken
    });

    this.mqtt = mqtt;

    mqtt.on("reconnect", () => {
      logger.info("MQTT reconnect");

      this.session.refreshCredentials().then(() => {
        this._updateWebsocketCredentials(this.session.credentials);
      });
    });

    mqtt.on("connect",   ()    => logger.info("MQTT Connect"));
    mqtt.on("close",     ()    => logger.info("MQTT Close"));
    mqtt.on("error",     (err) => logger.error("MQTT Error", err));
    return mqtt;
  }

  _updateWebsocketCredentials({ accessKeyId, secretAccessKey, sessionToken }) {
    logger.debug("updateWebsocketCredentials");
    this.mqtt.updateWebSocketCredentials(accessKeyId, secretAccessKey, sessionToken);
  }

  _getManifest(account, env) {
    return new Promise((resolve, reject) => {
      request.get(this._manifestUrl(account, env), (err, res, body) => {
        err ? reject(err) : resolve(JSON.parse(body));
      });
    });
  }

  _manifestUrl(account, env) {
    return `${this.manifestUrl}/?account=${account}&env=${env}`;
  }

  _parseError(error) {
    if      (error && error.errorMessage) { return JSON.parse(error.errorMessage) }
    else if (typeof(error) === "string")  { return JSON.parse(error) }
    else                                  { return error }
  }

  _isAuthError(error) {
    const authErrors = /No data|Token is expired|Invalid login token|Missing credentials in config|is not authorized to perform|Not Found/;

    return (typeof error === "string" && error.match(authErrors)) ||
           (typeof error.message === "string" && error.message.match(authErrors));
  }

}


module.exports = CloudConnect;
