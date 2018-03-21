(module
    (import "env" "blockhash_u64" (func $blockhash_u64 (param i32) (param i32) (param i32)))
    (import "env" "timestamp_u64" (func $timestamp_u64 (result i32)))
    (import "env" "blocknumber_u64" (func $blocknumber_u64 (result i32)))
    (import "env" "call_u64" (func $call_u64
        (param $gas_hi i32) (param $gas_lo i32) (param $addr i32) (param $value i32) (param $input i32) (param $input_len i32) (param $output i32) (param $output_len i32) (result i32)))

    (import "env" "dcall_u64" (func $dcall_u64
        (param $gas_hi i32) (param $gas_lo i32) (param $addr i32) (param $input i32) (param $input_len i32) (param $output i32) (param $output_len i32) (result i32)))

    (import "env" "scall_u64" (func $scall_u64
        (param $gas_hi i32) (param $gas_lo i32) (param $addr i32) (param $input i32) (param $input_len i32) (param $output i32) (param $output_len i32) (result i32)))


    (global $hi (mut i32) (i32.const 0))

    (func (export "i64setHi") (param i32)
        (set_global $hi (get_local 0))
    )

    (func (export "i64getHi") (result i32)
        (get_global $hi)
    )

    (func $ret_i64 (param i32) (result i64)
        (i64.or
            (i64.extend_u/i32
                (get_local 0)
            )
            (i64.shl
                (i64.extend_u/i32
                    (get_global $hi)
                )
                (i64.const 32)
            )
        )
    )

    (func (export "blockhash") (param $blocknumber i64) (param $dest i32)
        (call $blockhash_u64
            (i32.wrap/i64 (i64.shr_u (get_local $blocknumber) (i64.const 32)))
            (i32.wrap/i64 (get_local $blocknumber))
            (get_local $dest)
        )
    )

    (func (export "timestamp") (result i64)
        (call $ret_i64 (call $timestamp_u64))
    )

    (func (export "blocknumber") (result i64)
        (call $ret_i64 (call $blocknumber_u64))
    )

    (func (export "ccall") (param $gas i64) (param $addr i32 ) (param $value i32) (param $input i32) (param $input_len i32) (param $output i32) (param $output_len i32) (result i32)
        (call $call_u64
            (i32.wrap/i64 (i64.shr_u (get_local $gas) (i64.const 32)))
            (i32.wrap/i64 (get_local $gas))
            (get_local $addr)
            (get_local $value)
            (get_local $input)
            (get_local $input_len)
            (get_local $output)
            (get_local $output_len)
        )
    )

    (func (export "dcall") (param $gas i64) (param $addr i32 ) (param $input i32) (param $input_len i32) (param $output i32) (param $output_len i32) (result i32)
        (call $dcall_u64
            (i32.wrap/i64 (i64.shr_u (get_local $gas) (i64.const 32)))
            (i32.wrap/i64 (get_local $gas))
            (get_local $addr)
            (get_local $input)
            (get_local $input_len)
            (get_local $output)
            (get_local $output_len)
        )
    )

    (func (export "scall") (param $gas i64) (param $addr i32 ) (param $input i32) (param $input_len i32) (param $output i32) (param $output_len i32) (result i32)
        (call $scall_u64
            (i32.wrap/i64 (i64.shr_u (get_local $gas) (i64.const 32)))
            (i32.wrap/i64 (get_local $gas))
            (get_local $addr)
            (get_local $input)
            (get_local $input_len)
            (get_local $output)
            (get_local $output_len)
        )
    )
)
