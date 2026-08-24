import { BaziEngineError } from "@/error";

type BuildTuple<
  Length extends number,
  Item,
  Result extends readonly Item[] = [],
> = Result["length"] extends Length
  ? Result
  : BuildTuple<Length, Item, readonly [...Result, Item]>;

type Table<Item, Dimensions extends number[]> = Dimensions extends [
  infer Size extends number,
  ...infer Rest extends number[],
]
  ? BuildTuple<Size, Table<Item, Rest>>
  : Item;

type KeyedTensor<Value, Keys extends readonly (readonly PropertyKey[])[]> = Keys extends readonly [
  infer Current extends readonly PropertyKey[],
  ...infer Rest extends readonly (readonly PropertyKey[])[],
]
  ? { readonly [K in Current[number]]: KeyedTensor<Value, Rest> }
  : Value;

type TensorLeaf<T> = T extends readonly (infer Item)[] ? TensorLeaf<Item> : T;

class BitList<Items extends readonly PropertyKey[]> {
  public constructor(public readonly items: Items) {
    // 每个元素占一位, 故位数即元素个数; 掩码用 32 位整数, 上限 31 位.
    if (items.length > 31) {
      throw new BaziEngineError(`Too many items for a bitmask: ${items.length}`);
    }
  }
  /** 位数 = 元素个数. */
  public get length(): number {
    return this.items.length;
  }
  /** 可表示的掩码总数 (2 ** 位数). */
  public get size(): number {
    return 2 ** this.length;
  }
  public decode(mask: number): Items[number][] {
    const result: Items[number][] = [];
    this.items.forEach((item, bit) => {
      if ((mask & (1 << bit)) !== 0) result.push(item as Items[number]);
    });
    return result;
  }
  public encode(items: Items[number][]): number {
    let mask = 0;
    for (const item of items) {
      const bit = this.items.indexOf(item);
      if (bit === -1) throw new BaziEngineError(`Unknown item: ${String(item)}`);
      mask |= 1 << bit;
    }
    return mask;
  }
}

function createTable<
  I,
  T,
  Keys extends readonly (readonly PropertyKey[])[],
>(table: T, ...keyLists: Keys): KeyedTensor<TensorLeaf<T>, Keys> {
  const build = (value: unknown, depth: number): unknown => {
    if (depth === keyLists.length) return value;
    const keys = keyLists[depth]!;
    const source = Array.isArray(value) ? value : [];
    return Object.fromEntries(keys.map((key, index) => [key, build(source[index], depth + 1)]));
  };
  return build(table, 0) as KeyedTensor<TensorLeaf<T>, Keys>;
}

function createBitList<const Items extends readonly PropertyKey[]>(items: Items): BitList<Items> {
  return new BitList(items);
}

export { createTable, createBitList }
export type { Table, BitList }
