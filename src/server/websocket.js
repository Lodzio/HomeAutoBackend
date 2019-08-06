const WebSocket = require("ws");
const type = {
    UPDATE_DEVICE: 'UPDATE_DEVICE',
    CREATE_DEVICE: 'CREATE_DEVICE',
    FETCH_DEVICES: 'FETCH_DEVICES',
    DELETE_DEVICE: 'DELETE_DEVICE',
    ERROR: 'ERROR'
};

const listen = config => {
    const wss = new WebSocket.Server({port: config.WS_PORT}, () => console.log(`websocket listening on port ${config.WS_PORT}`));
    wss.on('connection', (ws) => {
        ws.on('message', (message) => {
            try {
                const obj = JSON.parse(message);
                switch (obj.type) {
                    case type.UPDATE_DEVICE:
                        break;
                    case type.CREATE_DEVICE:
                        break;
                    case type.FETCH_DEVICES:
                        break;
                    case type.DELETE_DEVICE:
                        break;
                    case type.ERROR:
                        break;
                    default:
                        console.error("Incorrect type");
                }
                ws.send(message);
            }
            catch (err) {
                console.error(err)
                message = {data: "exception handled in webscket.js:39", type:type.ERROR};
                ws.send(JSON.stringify(message));
            }
        });
    });
}

module.exports = {
    listen
}