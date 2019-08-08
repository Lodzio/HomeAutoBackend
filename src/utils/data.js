export const removeHandlersFromDevice = button => {
    const buttonCopy = {...button}
    delete buttonCopy.onSwitchHandler;
    return buttonCopy;
}
export const removeHandlersFromDevices = buttons => {
    return buttons.map(button => removeHandlersFromDevice(button))
}