import sensor from 'ds18b20-raspi'
const intervalsId = [];

export const readTemp = (id) => {
    return new Promise((resolve, reject) => {
        sensor.readC(id, 2, (err, temp) => {
            if (err) {
                reject(err)
            } else {
                resolve(temp);
            }
        })
    })
}

export const readDataWithInterval = (id, callback) => {
    intervalsId.push(setInterval(() => {
        const temp = sensor.readC(id)
        callback(temp, id);
    }, 3000))
}

export const clearAllTasks = () => {
    intervalsId.forEach(intervalId => clearInterval(intervalId))
}