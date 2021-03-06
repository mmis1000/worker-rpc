declare class WeakRef<T> {
    constructor (val: T)
    deref(): T|undefined
}

/**
 * @template T Value
 * @template U Unregister token
 * @template V Holding value
 */
declare class FinalizationRegistry<T, U, V> {
    constructor (cb: (iter: V)=>void)
    register(target: T, holding: V, token: U): void
    unregister(token: U): void
}

interface ValuePrimitive {
    type: 'primitive'
    value: null | undefined | boolean | number | string
}
interface ValueObject {
    type: 'object'
    ref: number
}
interface ValueFunction {
    type: 'function'
    ref: number
}

type Value = ValuePrimitive | ValueObject | ValueFunction

interface CommandGetRoot {
    type: 'root'
}

interface CommandRef {
    type: 'ref'
    id: number
}

interface CommandRefMany {
    type: 'ref-many'
    ids: number[]
}

interface CommandUnref {
    type: 'unref'
    id: number
}
interface CommandUnrefMany {
    type: 'unref-many'
    ids: number[]
}

interface CommandPropertyGet {
    type: 'get'
    id: number
    property: string
}

interface CommandPropertySet {
    type: 'set'
    id: number
    property: string
    value: Value
}

interface CommandPropertyGetDescriptor {
    type: 'getDescriptor'
    id: number
    property: string
}

interface CommandProperties {
    type: 'getProperties'
    id: number
}

interface CommandConstruct {
    type: 'construct'
    fn: Value,
    self: Value,
    args: Value[]
}

interface CommandCall {
    type: 'call'
    fn: Value,
    self: Value,
    args: Value[]
}


type Command = 
    CommandGetRoot |
    CommandRef |
    CommandRefMany |
    CommandUnref |
    CommandUnrefMany |
    CommandPropertyGet |
    CommandPropertySet |
    CommandPropertyGetDescriptor |
    CommandProperties |
    CommandConstruct |
    CommandCall

interface ResponseGetRoot {
    success: true
    value: Value
}

interface ResponseRef {
    success: true

}

interface ResponseUnref {
    success: true

}

interface ResponsePropertyGet {
    success: true
    value: Value
}

interface ResponsePropertySet {
    // success: true
    value: boolean
}

interface mappedDescriptorAcc {
    descriptorType: 'accessor',
    get: Value,
    set: Value,
    configurable: boolean | undefined,
    enumerable: boolean | undefined
}

interface mappedDescriptorVal {
    descriptorType: 'value',
    configurable: boolean | undefined,
    enumerable: boolean | undefined,
    writable: boolean | undefined,
    value: Value
}

type mappedDescriptor = mappedDescriptorAcc | mappedDescriptorVal

interface ResponsePropertyGetDescriptor {
    success: true
    descriptor: mappedDescriptor
}

interface ResponseProperties {
    success: true
    properties: string[]
    preloadDescriptor: { [key: string ]: mappedDescriptor }
}

interface ResponseError {
    success: false
    error: Value
}

interface ResponseConstruct {
    success: true
    value: Value
}
interface ResponseCall {
    success: true
    value: Value
}

interface MessagePortPayLoad {
    id: number
    from: number
    to: number
    state: 'send' | 'reply'
    error: boolean
    data: any
    __for?: any
}

interface Rpc {
    current: number,
    send (targetThread: number, data: any): any
}

type DomProxyResponse = 
    ResponseGetRoot |
    ResponseRef |
    ResponseUnref |
    ResponsePropertyGet |
    ResponsePropertySet |
    ResponsePropertyGetDescriptor |
    ResponseProperties |
    ResponseConstruct |
    ResponseCall |
    ResponseError

interface RpcSend {
    (target: number, command: CommandGetRoot): ResponseGetRoot | ResponseError
    (target: number, command: CommandRef): ResponseRef | ResponseError
    (target: number, command: CommandRefMany): ResponseRef | ResponseError
    (target: number, command: CommandUnref): ResponseUnref | ResponseError
    (target: number, command: CommandUnrefMany): ResponseUnref | ResponseError
    (target: number, command: CommandPropertyGet): ResponsePropertyGet | ResponseError
    (target: number, command: CommandPropertySet): ResponsePropertySet | ResponseError
    (target: number, command: CommandPropertyGetDescriptor): ResponsePropertyGetDescriptor | ResponseError
    (target: number, command: CommandProperties): ResponseProperties | ResponseError
    (target: number, command: CommandConstruct): ResponseConstruct | ResponseError
    (target: number, command: CommandCall): ResponseCall | ResponseError
}

type RpcSendWithThrow = {
    (target: number, command: CommandGetRoot): ResponseGetRoot
    (target: number, command: CommandRef): ResponseRef
    (target: number, command: CommandRefMany): ResponseRef
    (target: number, command: CommandUnref): ResponseUnref
    (target: number, command: CommandUnrefMany): ResponseUnref
    (target: number, command: CommandPropertyGet): ResponsePropertyGet
    (target: number, command: CommandPropertySet): ResponsePropertySet
    (target: number, command: CommandPropertyGetDescriptor): ResponsePropertyGetDescriptor
    (target: number, command: CommandProperties): ResponseProperties
    (target: number, command: CommandConstruct): ResponseConstruct
    (target: number, command: CommandCall): ResponseCall
}

declare function setImmediate(fn: (...arg: any[])=>void): number
declare function clearImmediate(id: number): void