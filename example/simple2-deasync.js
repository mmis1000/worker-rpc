const {
    Worker, isMainThread, parentPort, workerData
} = require('worker_threads');

const ObjectProxy = require('../src/object-proxy')
const listen = require('../src/rpc')
const createRelay = require('../src/port-relay')

function spawnWorker(id, data, transferList, callback) {
    const worker = new Worker(__filename, {
        workerData: {
            id,
            ...data
        },
        transferList
    });

    worker.on('message', (data) => {
        callback(data, worker)
    });

    worker.on('error', (err) => {
        console.log(`Worker error`, id, err);
    });

    worker.on('exit', (code) => {
        console.log(`Worker stopped with exit code ${code}`);
    });
}

if (isMainThread) {
    const sab = new SharedArrayBuffer(1024 * 1024 * 8)
    const ia32 = new Int32Array(sab)
    const relay = createRelay()
    let i = 0
    const proxy = ObjectProxy.create(
        l => listen(l, ia32, relay.port),
        () => ({ 
            a: 'AAAA',
            console
        })
    )
    const current = proxy.current

    const portB = relay.createFriend()
    const portC = relay.createFriend()
    spawnWorker( 'b',{ host: current, ia32, port: portB }, [portB], function (bWorkerId, workerB) {
            spawnWorker('c', { host: current, ia32, port: portC }, [portC], function (cWorkerId, workerC) {
                const bGlobal = proxy.getRemote(bWorkerId)
                const cGlobal = proxy.getRemote(cWorkerId)
                console.log(bGlobal.b, cGlobal.c)
                var fn = bGlobal.wrap(cGlobal.wrap((a) => a))
                console.log(fn(1))

                const start = Date.now()
                console.log(start)
                let res = 0
                for (let i = 0; i < 2000; i++) {
                    res +=fn(1)
                }
                console.log(res, Date.now() - start)

                workerB.postMessage(cWorkerId)
                workerC.postMessage(bWorkerId)
            }) 
        }
    )
} else {
    const ia32 = workerData.ia32;
    const port = workerData.port;
    const host = workerData.host;
    const id = workerData.id

    if (id === 'b') {
        workerB(ia32, port, host)
    }

    if (id === 'c') {
        workerC(ia32, port, host)
    }
}

function workerB (ia32, port, host) {
    const proxy = ObjectProxy.create(
        l => listen(l, ia32, port),
        () => ({
            b: 'BBBB',
            wrap: (cb) => ((count) => cb(count + 2))
        })
    )

    const mainLand = proxy.getRemote(host)

    parentPort.once('message', (cWorkerId) => {
        const workerC = proxy.getRemote(cWorkerId)
        mainLand.console.log('call from b to c ' + workerC.c)
    });

    parentPort.postMessage(proxy.current)
}

function workerC (ia32, port, host) {
    const proxy = ObjectProxy.create(
        l => listen(l, ia32, port),
        () => ({
            c: 'CCCC',
            wrap: (cb) => ((count) => cb(count + 3))
        })
    )

    const mainLand = proxy.getRemote(host)

    parentPort.once('message', (bWorkerId) => {
        const workerB = proxy.getRemote(bWorkerId)
        mainLand.console.log('call from c to b ' + workerB.b)
    });

    parentPort.postMessage(proxy.current)
}