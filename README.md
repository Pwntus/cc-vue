# cc-frontend-vue

> Frontend Cloud Connect Cognito authentication using Vue.js 2

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report
```

For detailed explanation on how things work, checkout the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).

# What is this?

This is a frontend example written in [Vue.js 2](https://vuejs.org/) which demonstrates how to obtain a Cognito Identity and execute lambda API calls. It has two components; **Login** and **Dashboard**.

* Login

	A login form where the user can provide Cloud Connect credentials.

* Dashboard

    Allow the authenticated user to call some predefined Cloud Connect API functions (lambda functions) with editable example payload.

## The Cloud Connect class

The class can be found in [src/CloudConnect.js](src/CloudConnect.js) and is a simplified class for performing Cloud Connect API calls. It should be well documented and easy to follow on every step. Some prior knowledge with JavaScript ES6 is required.

### Authentication

A user can obtain a Cognito Identity by calling the function `CloudConnect.login()`. The login function returns a Promise which can be used to take appropriate action depending on the outcome.

**Example**
```javascript
let CC = new CloudConnect
CC.login('JohnDoe', '********')
.then(() => {
    // Successful login
}, error => {
    // Fail with message 'error'
})
```

### Performing lambda API calls

When a user is authenticated and has a valid Cognito Identity, the `CloudConnect.lambda()` function can be used to directly invoke Cloud Connect API calls.

```javascript
lambda (function_name, payload)
```
Where:

`function_name` - The lambda function name (e.g. 'ThingLambda', obtained in the Cloud Connect technical specification).

`payload` - a JSON string containing the API payload (e.g. an Elasticsearch query).

**Example**

```javascript
// Execute an Elasticsearch query using the ObservationLambda API

const query = `
{
  "action": "FIND",
  "query": {
    "size": 1,
    "query": { ... },
    "aggs": { ... }
  }
}`

CC.lambda('ObservationLambda', query)
.then(result => {
    // Successful, return data in 'result'
}, error => {
    // Fail with message 'error'
})
```



**Todo:** session based authentication with automatic refresh of token.