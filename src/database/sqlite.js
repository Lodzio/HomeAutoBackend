import sqlite3 from 'sqlite3'
import fs from 'fs'
const tables = {
    DEVICES: 'devices'
}

let initFun = database => {}
export const configureNewDB = database => {
    // database.serialize((database) => {
        database.run(`CREATE TABLE ${tables.DEVICES} ( id TEXT PRIMARY KEY, title TEXT NOT NULL, type TEXT NOT NULL, value INTEGER, interface TEXT)`);
    // })
    console.log('init db')
}
try {
    if (fs.existsSync('./database.db')) {
      //file exists
    } else {
        initFun = configureNewDB
    }
} catch(err) {
    console.error(err)
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
    db.run(`INSERT INTO ${tables.DEVICES} VALUES ("${device.id}","${device.title}", ${device.value}, "${device.interface}")`)
}

export const updateDevice = (device) => {
    db.run('UPDATE table_name SET col1="work" WHERE col2="test"')
}

export const deleteDevice = (device) => {
    db.run('DELETE FROM table_name')
}

// db.serialize(function() {
 
//   const stmt = db.prepare("INSERT INTO lorem VALUES (?)");
//   for (var i = 0; i < 10; i++) {
//       stmt.run("Ipsum " + i);
//   }
//   stmt.finalize();
 
//   db.each("SELECT rowid AS id, info FROM lorem", function(err, row) {
//       console.log(row.id + ": " + row.info);
//   });
// });
 
// db.close();