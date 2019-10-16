import * as Shelly from './shelly/shelly';
import { HTTP_PORT, WS_PORT } from './config/config';
import * as HTTP from './server/http';
import path from 'path';
import * as Websocket from './server/websocket';
import { createStructureForDatabase, createStructuresForDatabase, createSwitchHandler } from './utils/data';
import * as Database from './database/sqlite';
import * as Interfaces from './constants/interfaces';
import * as DS18B20 from './DS18B20/ds18b20'

/* devices: {
*    title: string,
*    type: 'switch' | 'sensor',
*    value: 1 || 0,
*    interface: 'Shelly',
*    id: string,
*    onSwitchHandler: (data) => void
* }
*/

class App {
	detectedAndNotSavedDevices = [];
	devices = [];
	websocketEventHandlers = {};

	constructor() {
		Database.selectDevices().then((rows) => {
			this.devices = rows.map((row) => ({ ...row, onSwitchHandler: createSwitchHandler(row.id, row.interface) }));
			Shelly.run(this.onShellyChangeHandler);
			Websocket.listen({ WS_PORT }, this.websocketEventHandlers);
			HTTP.listen({ HTTP_PORT, WS_PORT, HTMLPath: path.join(__dirname, '/../public') });
			this.configWebsocketEventHandlers();
		});
	}
	configWebsocketEventHandlers = () => {
		this.websocketEventHandlers[Websocket.types.UPDATE_DEVICE] = this.handleDeviceUpdateRequest;
		this.websocketEventHandlers[Websocket.types.CREATE_DEVICE] = this.handleDeviceCreateRequest;
		this.websocketEventHandlers[Websocket.types.DELETE_DEVICE] = this.handleDeviceDeleteRequest;
		this.websocketEventHandlers[Websocket.types.SWITCH_DEVICE] = (data) =>
			this.devices.find((button) => button.id === data.id).onSwitchHandler(data.value);
		this.websocketEventHandlers[Websocket.types.FETCH_DEVICES] = () => createStructuresForDatabase(this.devices);
		this.websocketEventHandlers[Websocket.types.FETCH_DETECTED_DEVICES] = () =>
			createStructuresForDatabase(this.detectedAndNotSavedDevices);
		this.websocketEventHandlers[Websocket.types.FETCH_LOGS_BY_ID] = this.fetchLogsById;
		this.websocketEventHandlers[Websocket.types.ERROR] = (data) => console.error('ERROR: ', data);
	};
	onShellyChangeHandler = (change) => {
		const data = {
			type: 'button',
			value: change.relay === 'on' ? 1 : 0,
			id: change.id,
			interface: Interfaces.Shelly
		};

		const deviceIndex = this.devices.findIndex((device) => device.id === change.id);
		const detectedDeviceIndex = this.detectedAndNotSavedDevices.findIndex((device) => device.id === change.id);

		if (deviceIndex !== -1) {
			this.devices[deviceIndex] = { ...this.devices[deviceIndex], value: data.value };
			Websocket.sendToAllClients(
				createStructureForDatabase(this.devices[deviceIndex]),
				Websocket.types.UPDATE_DEVICE
			);
		} else if (detectedDeviceIndex !== -1) {
			data.title = 'Shelly';
			this.detectedAndNotSavedDevices[detectedDeviceIndex] = data;
		} else {
			data.title = 'Shelly';
			this.detectedAndNotSavedDevices.push(data);
		}
	};
	handleDeviceUpdateRequest = (data) => {
		const index = this.devices.findIndex((button) => button.id === data.id);
		this.devices[index] = { ...this.devices[index], ...data };
		const device = createStructureForDatabase(this.devices[index]);
		Database.updateDevice(device);
		return device;
	};
	fetchLogsById = async (data) => {
		const logs = await Database.selectLogs(data.id);
		return { ...data, logs };
	};
	handleDeviceCreateRequest = async (data) => {
		console.log('handleDeviceCreateRequest', data);
		if (data.interface === Interfaces.Shelly) {
			this.devices.push({
				...data,
				onSwitchHandler: createSwitchHandler(data.id, data.interface)
			});
			const index = this.detectedAndNotSavedDevices.findIndex((device) => device.id === data.id);
			if (index !== -1) {
				this.detectedAndNotSavedDevices.splice(index, 1);
			}
		} else if (data.interface === Interfaces.DS18B20) {
			data.id = '28-02158222adff';
			data.value = await DS18B20.readTemp(data.id)
			this.devices.push({
				...data,
			});
			DS18B20.readDataWithInterval(data.id, temp => {
				data.value = temp;
				console.log('new meas', data)
				this.handleDeviceUpdateRequest(data);
				Websocket.sendToAllClients(
					createStructureForDatabase(data),
					Websocket.types.UPDATE_DEVICE
				);
			})
		}
		console.log('insertDevice', data)
		Database.insertDevice(data);
		return Promise.resolve(data);
	};
	handleDeviceDeleteRequest = (data) => {
		if (data.interface === Interfaces.Shelly) {
			const index = this.devices.findIndex((device) => device.id === data.id);
			if (index !== -1) {
				this.detectedAndNotSavedDevices.push(this.devices[index]);
				this.devices.splice(index, 1);
			}
		}
		Database.deleteDevice(data);
		return data;
	};
}

export default App;
