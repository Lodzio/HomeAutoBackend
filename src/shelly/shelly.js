const mqtt  = require('mqtt').connect('mqtt://localhost:27007')
const {exec} = require('child_process');

const shellies = {}

let onDeviceChange = () => {}

const setRelay = (id, state) => {
    mqtt.publish(`shellies/${id}/relay/0/command`, state)
}

const getAllDevicesInfo = () => shellies

const run = (onDeviceChange) => {
    exec('mosquitto -p 27007', (error, stdout, stderr) => {
        if (error) {console.error(error);}
    });
    mqtt.on('connect', () => {
        mqtt.subscribe('shellies/#', (err) => {
        if (err) {console.error(err)}
      })
    })
    const messageHandler = (deviceId, prop, message) => {
        if (shellies[deviceId] !== undefined){
            shellies[deviceId][prop] = message;
            onDeviceChange({
                id: deviceId,
                ...shellies[deviceId]
            })
        }
    }
    mqtt.on('message', (topic, message) => {
        if (topic === 'shellies/announce'){
            const announcement = JSON.parse(message.toString())
            shellies[announcement.id] = {ip: announcement.ip}
        } else {
            const id = topic.split('/')[1];
            const prop = topic.split('/')[2];
            messageHandler(id, prop, message.toString())
        }
    })
}

module.exports = {
    getAllDevicesInfo,
    setRelay,
    run,
    commands: {
        ON: 'on',
        OFF: 'off'
    }
}