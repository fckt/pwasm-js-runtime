cargo build --target wasm32-unknown-unknown --release;
# https://github.com/alexcrichton/wasm-gc

wasm-gc target/wasm32-unknown-unknown/release/gas_injector.wasm ../src/wasm/gas_injector.wasm;
