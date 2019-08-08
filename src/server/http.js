import express from "express"
const app = express();
// const init = config => {
//     app.use(express.static(path.join(__dirname, '/build')));
//     app.get('/', (req, res) => {
//         res.sendFile(path.join(__dirname + '/build/index.html'));
//     });
//     app.get('/websocket_port', (req, res) => {
//         res.send({port: WS_PORT})
//     })
// }

export const listen = config => {
    app.get('/websocket_port', (req, res) => {
        res.json({port: config.WS_PORT})
    })
    app.use(express.static(config.HTMLPath));
    app.get('/', (req, res) => {
        res.sendFile(`${config.HTMLPath}/index.html`);
    });
    app.listen(config.HTTP_PORT, () => console.log(`http listening on port ${config.HTTP_PORT}`))
}