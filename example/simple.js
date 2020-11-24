const {
    Worker, isMainThread, parentPort, workerData
} = require('worker_threads');

const DomProxy = require('../src/dom-proxy')

if (isMainThread) {
    const sab = new SharedArrayBuffer(1024 * 1024 * 8)
    const ia32 = new Int32Array(sab)
    let i = 0
    const proxy = DomProxy.create(ia32, () => ({ b: 'BBBB' , console, B: () => i++, process }))

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
    const host = workerData.host;
    const proxy = DomProxy.create(ia32, () => ({ a: 'AAAA', A: (a) => mainLand.B() }))
    const mainLand = proxy.getRemote(host)

    parentPort.once('message', (message) => {
        mainLand.console.log(message)
        mainLand.console.log(mainLand.b)
    });

    parentPort.postMessage(proxy.current)
}