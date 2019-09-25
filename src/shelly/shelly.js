import * as mqtt from 'mqtt';
import { exec } from 'child_process';
const client = mqtt.connect('mqtt://localhost:27007');
const shellies = {};

export const setRelay = (id, state) => {
	client.publish(`shellies/${id}/relay/0/command`, state);
};

export const getAllDevicesInfo = () => shellies;

export const run = (onDeviceChange) => {
	exec('mosquitto -p 27007', (error, stdout, stderr) => {
		if (error) {
			console.error(error);
		}
	});
	client.on('connect', () => {
		client.subscribe('shellies/#', (err) => {
			if (err) {
				console.error(err);
			}
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
			console.log('newShelly', announcement.id);
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
