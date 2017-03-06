## Cloud Connect library

### Building

Building is done with [npm](https://www.npmjs.com/):

    npm install
    npm link

or [yarn](https://yarnpkg.com/):

    yarn
    yarn link


### Usage

To use the library in your own project you need to run

    npm link cloud-connect

in you project directory (optionally replace npm with yarn).

The below example connects to the Cloud Connect platform, subscribes to an MQTT topic, registers a message
handler that triggers for each received message, and then publishes to the topic it is subscribed on.

```javascript
const CloudConnect = require("cloud-connect");
const cc = new CloudConnect(account, env, username, password);

cc.init().then(() => {
  cc.mqtt.on("connect", () => {
    cc.mqtt.subscribe("someTopic");
  });

  cc.mqtt.on("message", (topic, payload) => {
    console.log(`Received on ${topic}:`, payload.toString());
  });

  cc.mqtt.publish("someTopic", "Hello World!");
})
```
