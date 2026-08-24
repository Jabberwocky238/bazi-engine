/** 引擎错误类型. 独立成模块以便任意模块 (含零依赖的 bitmap) 引用而不产生循环. */

/** 本引擎抛出的所有错误的基类. */
export class BaziEngineError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "BaziEngineError";
    }
}
