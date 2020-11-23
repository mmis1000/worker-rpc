const {
    Worker, isMainThread, parentPort, workerData
} = require('worker_threads');

const DomProxy = require('../src/dom-proxy')

if (isMainThread) {
    const sab = new SharedArrayBuffer(1024 * 1024 * 8)
    const ia32 = new Int32Array(sab)
    const proxy = DomProxy.create(ia32, () => ({ b: 'BBBB' , console }))

    const worker = new Worker(__filename, {
        workerData: {
            ia32,
            host: proxy.current
        }
    });

    worker.on('message', (workerId) => {
        console.log('main ready')
        const remote = proxy.getRemote(workerId)
        console.log(remote.a)

        const start = Date.now()
        console.log(start)
        for (let i = 0; i < 10000; i++) {
            remote.A(i)
        }
        console.log(Date.now() - start, remote.a)

        worker.postMessage('Hello World')
    });

    worker.on('exit', (code) => {
        console(`Worker stopped with exit code ${code}`);
    });

} else {
    const ia32 = workerData.ia32;
    const host = workerData.host;
    const proxy = DomProxy.create(ia32, () => ({ a: 'AAAA', A: (a) => a }))
    const mainLand = proxy.getRemote(host)

    parentPort.once('message', (message) => {
        mainLand.console.log(message)
        mainLand.console.log(mainLand.b)
    });

    parentPort.postMessage(proxy.current)
}