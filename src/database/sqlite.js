import sqlite3 from 'sqlite3';
import fs from 'fs';
const tables = {
	DEVICES: 'devices'
};

let initFun = (database) => {};
const configureNewDB = (database) => {
	// database.serialize((database) => {
	database.run(
		`CREATE TABLE ${tables.DEVICES} ( id TEXT PRIMARY KEY, title TEXT NOT NULL, type TEXT NOT NULL, value INTEGER, interface TEXT)`
	);
	// })
	console.log('init db');
};
try {
	if (fs.existsSync('./database.db')) {
		//file exists
	} else {
		initFun = configureNewDB;
	}
} catch (err) {
	console.error(err);
}

const db = new sqlite3.Database('./database.db');
initFun(db);

/* devices: {
*    title: string,
*    type: 'switch' | 'sensor',
*    value: 1 || 0,
*    interface: 'Shelly'
*    id: string,
* }
*/

export const insertDevice = (device) => {
	console.log('insertDevice', device);
	db.run(
		`INSERT INTO ${tables.DEVICES} VALUES ("${device.id}","${device.title}", "${device.type}", ${device.value}, "${device.interface}")`
	);
};

export const updateDevice = (device) => {
	let command = `UPDATE ${tables.DEVICES} SET`;
	Object.keys(device).forEach((key) => key !== 'id' && (command += ` ${key}="${device[key]}",`));
	command = command.slice(0, -1);
	command += ` WHERE id="${device.id}"`;
	console.log('updateDevice', device);
	db.run(command);
};

export const deleteDevice = (device) => {
	db.run(`DELETE FROM ${tables.DEVICES} WHERE id="${device.id}"`);
};

export const selectDevices = (callback) => {
	db.all(`SELECT * FROM ${tables.DEVICES}`, (err, result) => {
		if (err) {
			console.error(err);
		} else {
			callback(result);
		}
	});
};
