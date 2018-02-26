// @flow

import fs from 'fs';
import Long from 'long';

import Externalities from "./externalities";
import { FixedArray, Address, H256 } from "./types";
import { readImports } from "./utils";

export async function exec(ext: Externalities, module: ArrayBuffer, args: ?Uint8Array): Promise<Uint8Array> {
    const imports = readImports(module);
    const memory: Object = new global.WebAssembly.Memory(imports.memory.limits);
    const runtime = new Runtime(memory, ext, args || Uint8Array.from([]));
    const instance = await runtime.instantiate(module);
    // Call export
    instance.exports.call();
    // Return result from runtime
    return runtime.result;
}

class Runtime {
    memory: Object;
    ext: Externalities;
    args: Uint8Array;
    result: Uint8Array;
    i64setHi: Function;
    i64getHi: Function;

    constructor (memory: Object, ext: Externalities, args: Uint8Array) {
        this.memory = memory;
        this.ext = ext;
        this.args = args;
    }

    async instantiate(module: ArrayBuffer): Promise<Object> {
        const imports = {};

        imports.memory = this.memory;
        const proxy = fs.readFileSync('/Users/fro/parity/pwasm-runtime/src/proxy.wasm');
        const {instance: proxyInstance} = await global.WebAssembly.instantiate(proxy, {env: {
            timestamp_u64: this.timestamp_u64.bind(this),
            blocknumber_u64: this.blocknumber_u64.bind(this),
        }});

        this.i64setHi = proxyInstance.exports.i64setHi;
        this.i64getHi = proxyInstance.exports.i64getHi;

        imports.timestamp = proxyInstance.exports.timestamp;
        imports.blocknumber = proxyInstance.exports.blocknumber;

        imports.storage_read = this.storage_read.bind(this);
        imports.storage_write = this.storage_write.bind(this);
        imports.ret = this.ret.bind(this);
        imports.gas = this.gas.bind(this);
        imports.input_length = this.input_length.bind(this);
        imports.fetch_input = this.fetch_input.bind(this);
        imports.panic = this.panic.bind(this);
        imports.debug = this.debug.bind(this);
        imports.ccall = this.ccall.bind(this);
        imports.dcall = this.dcall.bind(this);
        imports.scall = this.scall.bind(this);
        imports.address = this.address.bind(this);
        imports.sender = this.sender.bind(this);
        imports.origin = this.origin.bind(this);
        imports.value = this.value.bind(this);
        imports.suicide = this.suicide.bind(this);
        imports.blockhash = this.blockhash.bind(this);
        imports.coinbase = this.coinbase.bind(this);
        imports.difficulty = this.difficulty.bind(this);
        imports.gaslimit = this.gaslimit.bind(this);
        imports.elog = this.elog.bind(this);

        const { instance } = await global.WebAssembly.instantiate(module, {env: imports});
        return instance;
    }

    viewAt(ptr: ?number, len: ?number): Uint8Array {
        return new Uint8Array(this.memory.buffer, ptr || undefined, len || undefined);
    }

    copyAt(ptr: ?number, len: ?number): Uint8Array {
        const newArray = new Uint8Array(len || 0);
        newArray.set(new Uint8Array(this.memory.buffer, ptr || undefined, len || undefined));
        return newArray;
    }

    fetchH256 (ptr: number): H256 {
        return H256.view(this.memory.buffer, ptr);
    }

    writeInto(ptr: number, value: FixedArray) {
        value.write(this.memory.buffer, ptr);
    }

    writeBigNumInto(ptr: number, value: FixedArray) {
        value.write(this.memory.buffer, ptr);
    }

    writeAddressInto(ptr: number, value: H256) {
        value.write(this.memory.buffer, ptr);
    }

    /**
     * Query the length of the input bytes
     */
    input_length(): number {
        return this.args.byteLength;
    }

    /**
     * Write input bytes to the memory location using the passed pointer
     */
    fetch_input(inputPtr: number) {
        this.viewAt(inputPtr).set(this.args);
    }

    /**
     * Return
     *
     * Syscall takes 2 arguments - pointer in sandboxed memory where result is and
     * the length of the result.
     */
    ret(ptr: number, len: number) {
        this.result = this.copyAt(ptr, len);
    }

    /**
     * Read from the storage to wasm memory
     */
    storage_read(keyPtr: number, valPtr: number) {
        const value = this.ext.storageAt(this.fetchH256(keyPtr));
        this.writeInto(valPtr, value);
    }

    /**
     * Write to storage from wasm memory
     */
    storage_write(keyPtr: number, valPtr: number) {
        this.ext.setStorage(this.fetchH256(keyPtr), this.fetchH256(valPtr));
    }

    /**
     * Message call
     */
    ccall(gas: number, addrPtr: number, valuePtr: number, inputPtr: number, outputPtr: number) {

    }

    /**
     * Delegate call
     */
    dcall() {

    }

    /**
     * Static call
     */
    scall() {

    }

    /**
     * Report gas cost with the params passed in wasm stack
     */
    gas() {

    }

    /**
     * User panic
     *
     * Contract can invoke this when he encounters unrecoverable error.
     */
    panic() {

    }

    debug() {

    }

    /**
     * Returns value (in Wei) passed to contract
     */
    value() {

    }

    /**
     * Creates a new contract

	 #Arguments:
     * endowment - how much value (in Wei) transfer to the newly created contract
	 * code_ptr - pointer to the code data
	 * code_len - length of the code data
	 * result_ptr - pointer to write an address of the newly created contract
     */
    create() {

    }

    /**
     * Pass suicide to state runtime
     */
    suicide() {

    }

    /**
     * Signature: `fn blockhash(number: i64, dest: *mut u8)`
     */

    blockhash() {

    }

    /**
     * Signature: `fn coinbase(dest: *mut u8)`
     */
    coinbase(dest: number) {
        this.writeInto(dest, this.ext.getEnvInfo().author);
    }

    /**
     * Signature: `fn difficulty(dest: *mut u8)`
     */
    difficulty(): number {
        return Number.MAX_SAFE_INTEGER
    }

    /**
     * Signature: `fn gaslimit(dest: *mut u8)`
     */
    gaslimit(): number {
        this.writeInto(dest, this.ext.getEnvInfo().author);
    }

    /**
     * Signature: `fn blocknumber() -> i64`
     */
    blocknumber_u64(): number {
        const { blocknumber } = this.ext.getEnvInfo();
        this.i64setHi(blocknumber.getHighBits());
        return blocknumber.getLowBits();
    }

    /**
     * Signature: `timestamp() -> i64`
     */
    timestamp_u64(): number {
        const { timestamp } = this.ext.getEnvInfo();
        this.i64setHi(timestamp.getHighBits());
        return timestamp.getLowBits();
    }

    /**
     * Signature: `fn address(dest: *mut u8)`
     */
    address() {

    }

    /**
     * Signature: `sender(dest: *mut u8)`
     */
    sender() {

    }

    /**
     * Signature: `origin(dest: *mut u8)`
     */
    origin() {

    }

    /**
     * Signature: `fn elog(topic_ptr: *const u8, topic_count: u32, data_ptr: *const u8, data_len: u32)`
     */
    elog() {

    }
}
