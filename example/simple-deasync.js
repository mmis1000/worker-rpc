const {
    Worker, isMainThread, parentPort, workerData
} = require('worker_threads');

const ObjectProxy = require('../src/object-proxy')
const listen = require('../src/rpc-deasync')
const createRelay = require('../src/port-relay')

if (isMainThread) {
    const sab = new SharedArrayBuffer(1024 * 1024 * 8)
    const ia32 = new Int32Array(sab)
    const relay = createRelay()
    let i = 0
    const proxy = ObjectProxy.create(
        listener => listen(listener, ia32, relay.port), 
        () => ({
            b: 'BBBB',
            console,
            B: () => i++,
            process
        })
    )

    const workerPort = relay.createFriend()
    const worker = new Worker(
        __filename,
        {
            workerData: {
                ia32,
                port: workerPort,
                host: proxy.current
            },
            transferList: [workerPort]
        }
    );

    worker.on('message', (workerId) => {
        console.log('main ready')
        const remote = proxy.getRemote(workerId)
        console.log(remote.a)

        const start = Date.now()
        console.log(start)
        let res = 0

        for (let i = 0; i < 2000; i++) {
            res += remote.A()
        }

        console.log(Date.now() - start, remote.a, res)

        worker.postMessage('Hello World')
    });

    worker.on('exit', (code) => {
        console.log(`Worker stopped with exit code ${code}`);
    });

} else {
    const ia32 = workerData.ia32;
    const port = workerData.port;
    const host = workerData.host;

    const proxy = ObjectProxy.create(
        listener => listen(listener, ia32, port),
        () => ({ a: 'AAAA', A: (a) => mainLand.B() })
    )

    const mainLand = proxy.getRemote(host)

    parentPort.once('message', (message) => {
        // port.postMessage({ state: 'send', from: proxy.current, to: host, data: { type: 'no-work' }})
        // FIXME: Why is this dead locked without setImmediate?
        setImmediate(() => {
            // console.trace('Current stack')
            mainLand.console.log(message)
            mainLand.console.log(mainLand.b, 'b')
        })
    });

    parentPort.postMessage(proxy.current)
}