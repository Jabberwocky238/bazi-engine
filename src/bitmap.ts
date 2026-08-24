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

type BitListT<Items extends readonly unknown[], Length extends number> = readonly (Items[number] | undefined)[] & { readonly length: Length };

class BitList<Items extends readonly PropertyKey[], BitLength extends number> {
  public constructor(public readonly items: Items, public readonly length: BitLength) {
    if (length < 0 || length > 31 || items.length > 2 ** length) {
      throw new RangeError("Invalid bit length");
    }
  }
  public decode(flag: number): BitListT<Items, Items["length"]> {
    return Array.from({ length: this.items.length }, (_, bit) => (flag & (1 << bit)) !== 0 ? this.items[bit] : undefined) as unknown as BitListT<Items, Items["length"]>;
  }
  public encode(item: Partial<Record<Items[number], boolean>>): number {
    let mask = 0;
    this.items.forEach((item, bit) => {
      if (flags[item as Items[number]]) mask |= 1 << bit;
    });
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
