import sqlite3 from 'sqlite3';
import fs from 'fs';
const tables = {
	DEVICES: 'devices',
	LOGS: 'logs'
};

let initFun = (database) => {};
const configureNewDB = (database) => {
	database.serialize(() => {
		database.run(
			`CREATE TABLE ${tables.DEVICES} ( id TEXT PRIMARY KEY, title TEXT NOT NULL, type TEXT NOT NULL, value INTEGER, interface TEXT)`
		);
		database.run(
			`CREATE TABLE ${tables.LOGS} ( deviceId TEXT, value INTEGER, timestamp INTEGER, FOREIGN KEY(deviceId) REFERENCES ${tables.DEVICES}(id))`
		);
		console.log('init db');
	});
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
	return new Promise((resolve, reject) => {
		db.run(
			`INSERT INTO ${tables.DEVICES} VALUES ("${device.id}","${device.title}", "${device.type}", ${device.value}, "${device.interface}")`,
			(err, result) => {
				if (err) {
					console.error(err);
					reject();
				}
				resolve();
			}
		);
	});
};

const checkIfValueChanged = (device) => {
	return new Promise((resolve, reject) => {
		db.get(`SELECT * FROM ${tables.DEVICES} WHERE id="${device.id}"`, (err, row) => {
			if (err) {
				console.error(err);
				reject();
			}
			const result = device.value !== row.value;
			resolve(result);
		});
	});
};

export const updateDevice = (device) => {
	return new Promise(async (resolve, reject) => {
		let command = `UPDATE ${tables.DEVICES} SET`;
		Object.keys(device).forEach((key) => key !== 'id' && (command += ` ${key}="${device[key]}",`));
		command = command.slice(0, -1);
		command += ` WHERE id="${device.id}"`;
		const shouldPushLog = await checkIfValueChanged(device);
		if (shouldPushLog) {
			addNewLog(device);
		}

		db.run(command, (err, result) => {
			if (err) {
				console.error(err);
				reject();
			}
			resolve();
		});
	});
};

const addNewLog = (device) => {
	console.log('add new log');
	db.run(`INSERT INTO ${tables.LOGS} VALUES ("${device.id}","${device.value}", "${new Date().getTime()}")`);
};

export const deleteDevice = (device) => {
	db.run(`DELETE FROM ${tables.DEVICES} WHERE id="${device.id}"`);
};

export const selectDevices = () => {
	return new Promise((resolve, reject) => {
		db.all(`SELECT * FROM ${tables.DEVICES}`, (err, result) => {
			if (err) {
				console.error(err);
				reject();
			} else {
				resolve(result);
			}
		});
	});
};

export const selectLogs = (id) => {
	return new Promise((resolve, reject) => {
		db.all(`SELECT * FROM ${tables.LOGS} WHERE deviceId="${id}"`, (err, result) => {
			if (err) {
				console.error(err);
				reject();
			} else {
				resolve(result);
			}
		});
	});
};
