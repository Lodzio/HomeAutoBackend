const mqtt = require('mqtt')
const client  = mqtt.connect('mqtt://localhost:27007')
const shellies = {}

const messageHandlers = (deviceId, prop, message) => {
    if (shellies[deviceId] !== undefined){
        shellies[deviceId][prop] = message;
    }
}
 
client.on('connect', () => {
  client.subscribe('shellies/#', function (err) {
    if (!err) {

    } else {
        console.error(err)
    }
  })
})
 
client.on('message', (topic, message) => {
    if (topic === 'shellies/announce'){
        const announcement = JSON.parse(message.toString())
        shellies[announcement.id] = {ip: announcement.ip}
    } else {
        const id = topic.split('/')[1];
        const prop = topic.split('/')[2];
        messageHandlers(id, prop, message.toString())
    }
    console.log(shellies)
})

const setRelay = (id, state) => {
    client.publish(`shellies/${id}/relay/0/command`, state)
}