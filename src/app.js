import * as Shelly from './shelly/shelly'
import {HTTP_PORT, WS_PORT} from './config/config'
import HTTP from './server/http'
import path from 'path'
import Websocket from './server/websocket'
import {removeHandlersFromButton, removeHandlersFromButtons} from './utils/data'
import Database from './database/sqlite'

/* devices: {
*    title: string,
*    type: 'switch' | 'sensor',
*    value: 1 || 0,
*    interface: 'Shelly',
*    id: string,
*    onSwitchHandler(data) => void
* }
*/

class App {
    constructor() {
        Shelly.run(this.onShellyChangeHandler);
        Websocket.listen({WS_PORT}, () => removeHandlersFromButtons(this.devices), this.onWebsocketEventFromClient);
        HTTP.listen({HTTP_PORT, WS_PORT, HTMLPath: path.join(__dirname, '/build')})

        this.websocketEventHandlers[Websocket.types.UPDATE_DEVICE] = this.handleDeviceUpdateRequest;
        this.websocketEventHandlers[Websocket.types.SWITCH_DEVICE] = data => devices.find(button => button.title === data.title).onSwitchHandler(data.value)
        this.websocketEventHandlers[Websocket.types.ERROR] = data => console.error('ERROR: ', data)
    }

    devices = [];
    websocketEventHandlers = {};

    onShellyChangeHandler = change => {
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

    onWebsocketEventFromClient = (event) => {
        const {data} = event;
        if(eventHandlers[event.type] !== undefined){
            eventHandlers[event.type](data)
        } else {
            console.error('unsupported type', event.type)
        }
    }

    handleDeviceUpdateRequest = (data) => {
        const index = devices.findIndex(button => button.id === data.id)
        devices[index] = {...devices[index], ...data};
    }
}

export default App;