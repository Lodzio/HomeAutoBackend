import * as Shelly from '../src/shelly/shelly';
// import * as mqtt from 'mqtt';
// const client = mqtt.connect('mqtt://localhost:27007');
import { expect } from 'chai';
const testDevice = {
	id: 'Shelly-test',
	ip: 'localhost'
};

describe('test shelly', () => {
	it('connect dummy shelly and check if handled by API', (done) => {
		Shelly.run(
			(change) => {
				expect(change).to.eql({ ...testDevice, relay: '1' });
				done();
			},
			() => {
				Shelly.client.publish(`shellies/announce`, JSON.stringify(testDevice));
				Shelly.client.publish(`shellies/${testDevice.id}/relay`, '1');
			}
		);
	});
	it('check if dummy shelly exist in list of devices', (done) => {
		expect(Shelly.getAllDevicesInfo()).to.have.property(testDevice.id);
		Shelly.stop();
		done();
	});
});
