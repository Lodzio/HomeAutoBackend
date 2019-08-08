const WebSocket = require("ws");
const types = {
    UPDATE_DEVICE: 'UPDATE_DEVICE',
    CREATE_DEVICE: 'CREATE_DEVICE',
    FETCH_DEVICES: 'FETCH_DEVICES',
    DELETE_DEVICE: 'DELETE_DEVICE',
    SWITCH_DEVICE: 'SWITCH_DEVICE',
    ERROR: 'ERROR'
};

let wss;

const listen = (config, dataToFetchOnConnection, onEventHandler) => {
    wss = new WebSocket.Server({port: config.WS_PORT, clientTracking: true}, () => console.log(`websocket listening on port ${config.WS_PORT}`));
    wss.on('connection', (ws) => {
        if (dataToFetchOnConnection){
            ws.send(JSON.stringify({type: types.FETCH_DEVICES, data: dataToFetchOnConnection()}))
        }
        ws.on('message', (stringMessage) => {
            try {
                const message = JSON.parse(stringMessage);
                const editedMessage = {...message, ...onEventHandler(message)}
                ws.send(JSON.stringify(editedMessage));
            }
            catch (err) {
                console.error(err)
                message = {data: "exception handled in webscket.js:39", type:types.ERROR};
                ws.send(JSON.stringify(message));
            }
        });
        ws.on('error', err => {
            console.error(err)
        })
    });
}

const sendToAllClients = (data, type)=> {
    wss.clients.forEach(ws => ws.send(JSON.stringify({data, type})))
}

module.exports = {
    listen,
    sendToAllClients,
    types,
}