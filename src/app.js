import * as Shelly from './shelly/shelly'
import {HTTP_PORT, WS_PORT} from './config/config'
import * as HTTP from './server/http'
import path from 'path'
import * as Websocket from './server/websocket'
import {removeHandlersFromDevice, removeHandlersFromDevices} from './utils/data'
import * as Database from './database/sqlite'
import * as Interfaces from './constants/interfaces'

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
        Websocket.listen({WS_PORT}, this.onWebsocketEventFromClient);
        HTTP.listen({HTTP_PORT, WS_PORT, HTMLPath: path.join(__dirname, '/build')})
        this.configWebsocketEventHandlers();
    }
    configWebsocketEventHandlers = () => {
        this.websocketEventHandlers[Websocket.types.UPDATE_DEVICE] = this.handleDeviceUpdateRequest;
        this.websocketEventHandlers[Websocket.types.CREATE_DEVICE] = this.handleDeviceCreateRequest;
        this.websocketEventHandlers[Websocket.types.DELETE_DEVICE] = this.handleDeviceDeleteRequest;
        this.websocketEventHandlers[Websocket.types.SWITCH_DEVICE] = data => this.devices.find(button => button.id === data.id).onSwitchHandler(data.value)
        this.websocketEventHandlers[Websocket.types.FETCH_DEVICES] = () => removeHandlersFromDevices(this.devices)
        this.websocketEventHandlers[Websocket.types.FETCH_DETECTED_DEVICES] = () => removeHandlersFromDevices(this.detectedAndNotSavedDevices)
        this.websocketEventHandlers[Websocket.types.ERROR] = data => console.error('ERROR: ', data)
    }
    onShellyChangeHandler = change => {
        const data = {
            title: change.id,
            type: 'button',
            value: change.relay === 'on'? 1: 0,
            id: change.id,
            interface: Interfaces.Shelly,
            onSwitchHandler: (newState) => Shelly.setRelay(change.id, newState === 1? Shelly.commands.ON : Shelly.commands.OFF)
        }

        const deviceIndex = this.devices.findIndex((device => device.id === change.id));
        const detectedDeviceIndex = this.detectedAndNotSavedDevices.findIndex((device => device.id === change.id));

    
        if (deviceIndex !== -1){
            data.title = this.devices[deviceIndex].title;
            this.devices[deviceIndex] = data
            Websocket.sendToAllClients(removeHandlersFromDevice(data), Websocket.types.UPDATE_DEVICE)
        } else if (detectedDeviceIndex !== -1){
            data.title = this.detectedAndNotSavedDevices[detectedDeviceIndex].title;
            this.detectedAndNotSavedDevices[detectedDeviceIndex] = data
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
        return removeHandlersFromDevice(this.devices[index]);
    }
    handleDeviceCreateRequest = (data) => {
        this.devices.push({
            ...data,
            onSwitchHandler: (newState) => Shelly.setRelay(data.id, newState === 1? Shelly.commands.ON : Shelly.commands.OFF)
        })
        if (data.interface === Interfaces.Shelly){
            const index = this.detectedAndNotSavedDevices.findIndex(device => device.id === data.id)
            if (index !== -1){
                this.detectedAndNotSavedDevices.splice(index, 1);
            }
        }
        return data;
    }
    handleDeviceDeleteRequest = (data) => {
        if (data.interface === Interfaces.Shelly){
            const index = this.devices.findIndex(device => device.id === data.id)
            if (index !== -1){
                this.detectedAndNotSavedDevices.push(this.devices[index])
                this.devices.splice(index, 1);
            }
        }
        return data;
    }
}

export default App;