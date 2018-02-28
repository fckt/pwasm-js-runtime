import { BinaryReader, BinaryReaderState, ExternalKind } from 'wasmparser';

type Imports = {
    memory: {
        limits: {
            initial: number,
            maximum?: number,
        }
    },
    table: {
        limits: {
            initial: number,
            maximum?: number,
        }
    }
}

export function readImports (module: ArrayBuffer): Imports {
    const reader = new BinaryReader();
    let result = {};
    reader.setData(module, 0, module.byteLength);
    while (reader.read()) {
        if (BinaryReaderState.IMPORT_SECTION_ENTRY === reader.state) {
            let imprt = reader.result;
            if (ExternalKind.Table === imprt.kind) {
                result.table = imprt.type;
                continue;
            }
            if (ExternalKind.Memory === imprt.kind) {
                result.memory = imprt.type;
                continue;
            }
        }
    }
    return result;
}
