import * as Shelly from './shelly/shelly'
import {HTTP_PORT, WS_PORT} from './config/config'
import * as HTTP from './server/http'
import path from 'path'
import * as Websocket from './server/websocket'
import {removeHandlersFromDevice, removeHandlersFromDevices} from './utils/data'
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

    detectedAndNotSavedDevices = [];
    devices = [];
    websocketEventHandlers = {};

    constructor() {
        Shelly.run(this.onShellyChangeHandler);
        Websocket.listen({WS_PORT}, () => removeHandlersFromDevices(this.devices), this.onWebsocketEventFromClient);
        HTTP.listen({HTTP_PORT, WS_PORT, HTMLPath: path.join(__dirname, '/build')})
        this.configWebsocketEventHandlers();
    }
    configWebsocketEventHandlers = () => {
        this.websocketEventHandlers[Websocket.types.UPDATE_DEVICE] = this.handleDeviceUpdateRequest;
        this.websocketEventHandlers[Websocket.types.CREATE_DEVICE] = this.handleDeviceCreateRequest;
        this.websocketEventHandlers[Websocket.types.DELETE_DEVICE] = this.handleDeviceDeleteRequest;
        this.websocketEventHandlers[Websocket.types.SWITCH_DEVICE] = data => this.devices.find(button => button.id === data.id).onSwitchHandler(data.value)
        this.websocketEventHandlers[Websocket.types.FETCH_DEVICES] = () => removeHandlersFromDevices(devices)
        this.websocketEventHandlers[Websocket.types.FETCH_DETECTED_DEVICEs] = () => removeHandlersFromDevices(this.detectedAndNotSavedDevices)
        this.websocketEventHandlers[Websocket.types.ERROR] = data => console.error('ERROR: ', data)
    }
    onShellyChangeHandler = change => {
        const data = {
            title: change.id,
            type: 'button',
            value: change.relay === 'on'? 1: 0,
            id: change.id,
            onSwitchHandler: (newState) => Shelly.setRelay(change.id, newState === 1? Shelly.commands.ON : Shelly.commands.OFF)
        }
    
        if (this.devices.find((value => value.title === change.id))){
            Websocket.sendToAllClients(removeHandlersFromDevice(data), Websocket.types.UPDATE_DEVICE)
        } else {
            this.detectedAndNotSavedDevices.push(data)
        }
    }
    onWebsocketEventFromClient = (event) => {
        if(this.websocketEventHandlers[event.type] !== undefined){
            return this.websocketEventHandlers[event.type](event.data)
        } else {
            console.error('unsupported type', event.type)
        }
    }
    handleDeviceUpdateRequest = (data) => {
        const index = this.devices.findIndex(button => button.id === data.id)
        this.devices[index] = {...this.devices[index], ...data};
    }
    handleDeviceCreateRequest = (data) => {
        
    }
    handleDeviceDeleteRequest = (data) => {
        
    }
}

export default App;