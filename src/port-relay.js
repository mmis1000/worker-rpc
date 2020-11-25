module.exports = function createRelay () {
    const { port1: mainSend, port2: mainReceiver } = new MessageChannel()
    mainSend.unref()
    mainReceiver.unref()

    /**
     * @type { Set<MessagePort> }
     */
    const ports = new Set()
    ports.add(mainReceiver)

    mainReceiver.onmessage = (ev) => {
        const data = ev.data

        for (let port of ports) {
            if (port !== mainReceiver) {
                // if (
                //     data.state === 'reply' && 
                //     data.__for.data.type === 'get' &&
                //     data.__for.data.property === 'console'
                // ) {
                //     console.trace('Current stack')
                // }
                port.postMessage(data)
            }
        }
    }

    mainReceiver.onmessageerror = (ev) => {
        console.error(ev)
    }

    return {
        port: mainSend,
        createFriend () {
            const { port1: mainSide, port2: workerSide } = new MessageChannel()
            mainSide.unref()
            workerSide.unref()

            ports.add(mainSide)
            mainSide.onmessage = (ev) => {
                const data = ev.data
                for (const port of ports) {
                    if (port !== mainSide) {
                        port.postMessage(data)
                    }
                }
            }

            mainSide.onmessageerror = (ev) => {
                console.error(ev)
            }
            return workerSide
        }
    }
}