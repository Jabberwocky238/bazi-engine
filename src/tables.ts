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

function createTable<
  T,
  Keys extends readonly (readonly PropertyKey[])[],
>(table: T, ...keyLists: Keys): KeyedTensor<T extends readonly unknown[] ? T[number] : T, Keys> {
  const build = (value: unknown, depth: number): unknown => {
    if (depth === keyLists.length) return value;
    const keys = keyLists[depth]!;
    const source = Array.isArray(value) ? value : [];
    return Object.fromEntries(keys.map((key, index) => [key, build(source[index], depth + 1)]));
  };
  return build(table, 0) as KeyedTensor<TensorLeaf<T>, Keys>;
}

export { createTable }
export type { Table }
