import * as Database from '../src/database/sqlite';
import * as Interfaces from '../src/constants/interfaces';
import { expect } from 'chai';
const testDevice = {
	id: 'DBtest',
	title: 'testTitle',
	interface: Interfaces.Shelly,
	type: 'button',
	value: 0
};

describe('test database', () => {
	it("check if test device doesn't exist in DB", async () => {
		const savedDevices = await Database.selectDevices();
		expect(savedDevices.find((device) => device.id === testDevice.id)).to.be.undefined;
	});
	it('insert device and check if device exist in DB', async () => {
		await Database.insertDevice(testDevice);
		const savedDevices = await Database.selectDevices();
		expect(savedDevices.find((device) => device.id === testDevice.id)).to.eql(testDevice);
	});
	it('edit device and check logs', async () => {
		await Database.updateDevice({ ...testDevice, value: 1 });
		const logs = await Database.selectLogs(testDevice.id);
		console.log(logs);
		expect(logs).to.eql([ { deviceId: testDevice.id, value: 1 } ]);
	});
	it("delete device and check if device doesn't exist in DB", async () => {
		await Database.deleteDevice(testDevice);
		const savedDevices = await Database.selectDevices();
		expect(savedDevices.find((device) => device.id === testDevice.id)).to.be.undefined;
	});
});
