import WebSocket from 'ws';
export const types = {
	UPDATE_DEVICE: 'UPDATE_DEVICE',
	CREATE_DEVICE: 'CREATE_DEVICE',
	FETCH_DEVICES: 'FETCH_DEVICES',
	DELETE_DEVICE: 'DELETE_DEVICE',
	SWITCH_DEVICE: 'SWITCH_DEVICE',
	FETCH_LOGS_BY_ID: 'FETCH_LOGS_BY_ID',
	FETCH_DETECTED_DEVICES: 'FETCH_DETECTED_DEVICES',
	ERROR: 'ERROR'
};

let wss;

const onEventHandler = (websocketEventHandlers) => async (event) => {
	if (websocketEventHandlers[event.type] !== undefined) {
		return await websocketEventHandlers[event.type](event.data);
	} else {
		console.error('unsupported type', event.type);
	}
};

export const listen = (config, eventHandlers) => {
	wss = new WebSocket.Server({ port: config.WS_PORT, clientTracking: true }, () =>
		console.log(`websocket listening on port ${config.WS_PORT}`)
	);
	wss.on('connection', (ws) => {
		ws.on('message', async (stringMessage) => {
			try {
				const message = JSON.parse(stringMessage);
				const editedMessage = { ...message };
				editedMessage.data = await onEventHandler(eventHandlers)(message);
				ws.send(JSON.stringify(editedMessage));
			} catch (err) {
				console.error(err);
				const message = { data: 'exception handled in webscket.js:39: ' + err, type: types.ERROR };
				ws.send(JSON.stringify(message));
			}
		});
		ws.on('error', (err) => {
			console.error(err);
		});
	});
};

export const sendToAllClients = (data, type) => {
	wss.clients.forEach((ws) => ws.send(JSON.stringify({ data, type })));
};
