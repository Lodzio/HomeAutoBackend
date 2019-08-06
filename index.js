const Shelly = require('./src/shelly')
const {HTTP_PORT, WS_PORT} = require('./src/config/config')
const HTTP = require('./src/server/http')
const path = require('path');
const Websocket = require('./src/server/websocket')

HTTP.listen({
    HTTP_PORT,
    WS_PORT,
    HTMLPath: path.join(__dirname, '/build')
})
Websocket.listen({WS_PORT});