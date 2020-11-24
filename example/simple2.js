const {
    Worker, isMainThread, parentPort, workerData
} = require('worker_threads');

const DomProxy = require('../src/dom-proxy')

function spawnWorker(id, data, callback) {
    const worker = new Worker(__filename, {
        workerData: {
            id,
            ...data
        }
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
    let i = 0
    const proxy = DomProxy.create(ia32, () => ({ a: 'AAAA' }))
    const current = proxy.current

    spawnWorker('b', { host: current, ia32 }, function (bWorkerId, workerB) {
        spawnWorker('c', { host: current, ia32 }, function (cWorkerId, workerC) {
            const bGlobal = proxy.getRemote(bWorkerId)
            const cGlobal = proxy.getRemote(cWorkerId)
            console.log(bGlobal.b, cGlobal.c)
            var fn = bGlobal.wrap(cGlobal.wrap((a) => a))
            console.log(fn(1))

            const start = Date.now()
            console.log(start)
            let res = 0
            for (let i = 0; i < 10000; i++) {
                res +=fn(1)
            }
            console.log(res, Date.now() - start)
        }) 
    })
} else {
    const ia32 = workerData.ia32;
    const host = workerData.host;
    const id = workerData.id

    if (id === 'b') {
        workerB(ia32, host)
    }

    if (id === 'c') {
        workerC(ia32, host)
    }
}

function workerB (ia32, host) {
    const proxy = DomProxy.create(ia32, () => ({
        b: 'BBBB',
        wrap: (cb) => ((count) => cb(count + 2))
    }))

    const mainLand = proxy.getRemote(host)

    parentPort.once('message', (message) => {
        mainLand.console.log(message)
        mainLand.console.log(mainLand.b)
    });

    parentPort.postMessage(proxy.current)
}

function workerC (ia32, host) {
    const proxy = DomProxy.create(ia32, () => ({
        c: 'CCCC',
        wrap: (cb) => ((count) => cb(count + 3))
    }))

    const mainLand = proxy.getRemote(host)

    parentPort.once('message', (message) => {
        mainLand.console.log(message)
        mainLand.console.log(mainLand.b)
    });

    parentPort.postMessage(proxy.current)
}