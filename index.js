const Shelly = require('./src/shelly/shelly')
const {HTTP_PORT, WS_PORT} = require('./src/config/config')
const HTTP = require('./src/server/http')
const path = require('path');
const Websocket = require('./src/server/websocket')
const {removeHandlersFromButton, removeHandlersFromButtons} = require('./src/utils/data')
const Database = require('./src/database/sqlite')
const devices = [];

/* devices: {
*    title: string,
*    type: 'switch' | 'sensor',
*    value: 1 || 0,
*    interface: 'Shelly'
*    onSwitchHandler(data) => void
* }
*/

const handleDeviceUpdate = (data) => {
    const index = devices.findIndex(button => button.id === data.id)
    devices[index] = {...devices[index], ...data};
}

const eventHandlers = {};
const initEventHandlers = () => {
    const {types} = Websocket;
    eventHandlers[types.UPDATE_DEVICE] = handleDeviceUpdate;
    eventHandlers[types.SWITCH_DEVICE] = data => devices.find(button => button.title === data.title).onSwitchHandler(data.value)
    eventHandlers[types.ERROR] = data => console.error('ERROR: ', data)
}
initEventHandlers();

const onEventFromClient = (event) => {
    const {data} = event;
    console.log(event)
    if(eventHandlers[event.type] !== undefined){
        eventHandlers[event.type](data)
    } else {
        console.log('unsupported type', event.type)
    }
}

HTTP.listen({
    HTTP_PORT,
    WS_PORT,
    HTMLPath: path.join(__dirname, '/build')
})

Websocket.listen({WS_PORT}, () => removeHandlersFromButtons(devices), onEventFromClient);
const OnShellyDeviceChangeHandler = change => {
    const data = {
        title: change.id,
        type: 'button',
        value: change.relay === 'on'? 1: 0,
        id: change.id,
        onSwitchHandler: (newState) => Shelly.setRelay(change.id, newState === 1? Shelly.commands.ON : Shelly.commands.OFF)
    }

    if (devices.find((value => value.title === change.id))){
        Websocket.sendToAllClients(removeHandlersFromButton(data), Websocket.types.UPDATE_DEVICE)
    } else {
        devices.push(data)
        Websocket.sendToAllClients(removeHandlersFromButton(data), Websocket.types.CREATE_DEVICE)
    }
    devices[change.id] = data;
}
Shelly.run(OnShellyDeviceChangeHandler)
