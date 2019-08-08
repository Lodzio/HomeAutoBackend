const removeHandlersFromButton = button => {
    const buttonCopy = {...button}
    delete buttonCopy.onSwitchHandler;
    return buttonCopy;
}
const removeHandlersFromButtons = buttons => {
    return buttons.map(button => removeHandlersFromButton(button))
}

module.exports = {
    removeHandlersFromButton,
    removeHandlersFromButtons
}