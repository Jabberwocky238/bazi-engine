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

class BitList<Items extends readonly PropertyKey[], BitLength extends number> {
  public constructor(public readonly items: Items, public readonly length: BitLength) {
    if (length < 0 || length > 31 || items.length > length) {
      throw new RangeError("Invalid bit length");
    }
  }
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
      if (bit === -1) throw new RangeError(`Unknown item: ${String(item)}`);
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

function createBitList<const Items extends readonly PropertyKey[], const Length extends number>(items: Items, length: Length): BitList<Items, Length> {
  return new BitList(items, length);
}

export { createTable, createBitList }
export type { Table, BitList }
