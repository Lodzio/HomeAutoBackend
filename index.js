const Shelly = require('./src/shelly/shelly')
const {HTTP_PORT, WS_PORT} = require('./src/config/config')
const HTTP = require('./src/server/http')
const path = require('path');
const Websocket = require('./src/server/websocket')
const buttons = [];

/*buttons: {
    title: string,
    type: 'switch' | 'sensor',
    value: 1 || 0,
    onSwitchHandler(data) => void
}
*/
const removeHandlersFromButton = button => {
    const buttonCopy = {...button}
    delete buttonCopy.onSwitchHandler;
    return buttonCopy;
}
const removeHandlersFromButtons = buttons => {
    return buttons.map(button => removeHandlersFromButton(button))
}

const onEventFromClient = (event) => {
    console.log(event)
    switch (event.type) {
        case Websocket.types.UPDATE_DEVICE:
            buttons.find(button => button.title === event.data.title).onSwitchHandler(event.data.value === 1? Shelly.Commands.on : Shelly.Commands.off)
            break;
        case Websocket.types.CREATE_DEVICE:
            break;
        case Websocket.types.FETCH_DEVICES:
            break;
        case Websocket.types.DELETE_DEVICE:
            break;
        case Websocket.types.ERROR:
            break;
        default:
            console.error("Incorrect type");
    }
}

HTTP.listen({
    HTTP_PORT,
    WS_PORT,
    HTMLPath: path.join(__dirname, '/build')
})

Websocket.listen({WS_PORT}, () => removeHandlersFromButtons(buttons), onEventFromClient);

Shelly.setOnDeviceChangeHandler(change => {
    const data = {
        title: change.id,
        type: 'button',
        value: change.relay === 'on'? 1: 0,
        onSwitchHandler: (newState) => Shelly.setRelay(change.id, newState)
    }
    if (buttons.find((value => value.title === change.id))){
        Websocket.sendToAllClients(removeHandlersFromButton(data), Websocket.types.UPDATE_DEVICE)
    } else {
        buttons.push(data)
        Websocket.sendToAllClients(removeHandlersFromButton(data), Websocket.types.CREATE_DEVICE)
    }
    buttons[change.id] = data;
})