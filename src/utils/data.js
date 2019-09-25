import * as Interfaces from '../constants/interfaces';
import * as Shelly from '../shelly/shelly';
import * as Database from '../database/sqlite';

export const removeHandlersFromDevice = (button) => {
	const buttonCopy = { ...button };
	delete buttonCopy.onSwitchHandler;
	return buttonCopy;
};
export const removeHandlersFromDevices = (buttons) => {
	return buttons.map((button) => removeHandlersFromDevice(button));
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
