import * as mqtt from 'mqtt';
import { exec, execSync } from 'child_process';
export const client = mqtt.connect('mqtt://localhost:27007');
const shellies = {};

export const setRelay = (id, state) => {
	client.publish(`shellies/${id}/relay/0/command`, state);
};

export const getAllDevicesInfo = () => shellies;

export const run = (onDeviceChange, onInit) => {
	try {
		execSync('pkill -9 mosquitto');
		exec('mosquitto -p 27007', (error, stdout, stderr) => {
			if (error) {
				console.error(error);
			}
		});
	} catch (err) { console.log(err) }
	client.on('connect', () => {
		client.subscribe('shellies/#', (err) => {
			if (err) {
				console.error(err);
			}
			onInit && onInit();
		});
	});
	const messageHandler = (deviceId, prop, message) => {
		if (shellies[deviceId] !== undefined) {
			shellies[deviceId][prop] = message;
			onDeviceChange({
				id: deviceId,
				...shellies[deviceId]
			});
		}
	};
	client.on('message', (topic, message) => {
		if (topic === 'shellies/announce') {
			const announcement = JSON.parse(message.toString());
			console.log('new shelly: ', announcement.id);
			shellies[announcement.id] = { ip: announcement.ip };
		} else {
			const id = topic.split('/')[1];
			const prop = topic.split('/')[2];
			messageHandler(id, prop, message.toString());
		}
	});
};

export const commands = {
	ON: 'on',
	OFF: 'off'
};

export const stop = () => {
	client.end();
	execSync('pkill mosquitto');
};
