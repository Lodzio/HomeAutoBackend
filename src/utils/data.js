import * as Interfaces from '../constants/interfaces';
import * as Shelly from '../shelly/shelly';
import * as Database from '../database/sqlite';

export const createStructureForDatabase = (device) => {
	const result = {
		title: device.title,
		type: device.type,
		value: device.value,
		interface: device.interface,
		id: device.id
	};
	return result;
};
export const createStructuresForDatabase = (devices) => {
	return devices.map(createStructureForDatabase);
};
export const createSwitchHandler = (id, deviceInterface) => {
	switch (deviceInterface) {
		case Interfaces.Shelly:
			return (newState) => {
				Shelly.setRelay(id, newState === 1 ? Shelly.commands.ON : Shelly.commands.OFF);
				Database.updateDevice({ id, value: newState });
			};
	}
};
