// @ts-check
var deasync = require('deasync')


/**
 * 
 * @param {(from: number, message: any)=>any} handler 
 * @param {Int32Array} ia32 
 * @param {MessagePort} port 
 * @returns {Rpc}
 */
module.exports = function listen(handler, ia32, port) {
    const OFFSET_THREAD_INDEX = 0;
    let current = 0

    while (Atomics.compareExchange(ia32, OFFSET_THREAD_INDEX, current, current + 1) !== current) {
        current++;
    }

    /**
     * @type {Map<number, (error: any, arg: any) => void>}
     */
    const pendingEvents = new Map()

    port.onmessageerror = (ev) => {
        console.error(ev)
    }
    port.onmessage = (/** @type {MessageEvent<MessagePortPayLoad>} */ev) => {
        const request = ev.data

        if (request.to !== current) {
            return
        }

        if (request.state === 'send') {
            try {
                const res = handler(request.from, request.data)
                /**
                 * @type {MessagePortPayLoad}
                 */
                const payload = {
                    __for: request,
                    id: request.id,
                    from: request.to,
                    to: request.from,
                    error: false,
                    data: res,
                    state: 'reply'
                }
                port.postMessage(payload)
            } catch (err) {
                /**
                 * @type {MessagePortPayLoad}
                 */
                const payload = {
                    __for: request,
                    id: request.id,
                    from: request.to,
                    to: request.from,
                    error: true,
                    data: err,
                    state: 'reply'
                }
                port.postMessage(payload)
            }
        } else {
            const listener = pendingEvents.get(request.id)
            pendingEvents.delete(request.id)

            if (!listener) {
                throw new Error('Assert failure, non exist event ' + request.id)
            }

            if (request.error) {
                listener(request.data, null)
            } else {
                listener(null, request.data)
            }
        }
    }

    /**
     * @param {number} target
     * @param {any} data
     * @param {(error: any, arg: any) => void} cb
     */
    function sendAsync (target, data, cb) {
        const eventId = Math.random()
        pendingEvents.set(eventId, cb)
        /**
         * @type {MessagePortPayLoad}
         */
        const payload = {
            id: eventId,
            from: current,
            to: target,
            error: false,
            data,
            state: 'send'
        }
        port.postMessage(payload)
    }

    const sendSync = deasync(sendAsync)
    
    return {
        current,
        send (target, data) {
            return sendSync(target, data)
        }
    }
}