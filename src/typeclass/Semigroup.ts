/**
 * `Semigroup<A>` describes a way of combining two values of type `A` that is associative.
 *
 * ```ts
 * export interface Semigroup<A> {
 *    combine: (that: A) => (self: A) => A
 *    combineMany: (collection: Iterable<A>) => (self: A) => A
 * }
 * ```
 *
 * The combine operator must be associative, meaning that if we combine `a` with `b` and then combine the result
 * with `c` we must get the same value as if we combine `b` with `c` and then combine `a` with the result.
 *
 * ```
 * (a <> b) <> c === a <> (b <> c)
 * ```
 *
 * The `Semigroup` abstraction allows us to combine values of a data type to build a new value of that data type
 * with richer structure.
 *
 * @since 1.0.0
 */
import type { TypeLambda } from "@fp-ts/core/HKT"
import { identity } from "@fp-ts/core/internal/Function"
import type * as invariant from "@fp-ts/core/typeclass/Invariant"
import type { Order } from "@fp-ts/core/typeclass/Order"
import type * as product from "@fp-ts/core/typeclass/Product"
import type * as semiProduct from "@fp-ts/core/typeclass/SemiProduct"

/**
 * @category type class
 * @since 1.0.0
 */
export interface Semigroup<A> {
  combine: (that: A) => (self: A) => A
  combineMany: (collection: Iterable<A>) => (self: A) => A
}

/**
 * @category type lambdas
 * @since 1.0.0
 */
export interface SemigroupTypeLambda extends TypeLambda {
  type: Semigroup<this["Target"]>
}

/**
 * Useful when `combineMany` can't be optimised.
 *
 * @category constructors
 * @since 1.0.0
 */
export const fromCombine = <A>(combine: Semigroup<A>["combine"]): Semigroup<A> => ({
  combine,
  combineMany: (collection) =>
    (self) => {
      let out: A = self
      for (const a of collection) {
        out = combine(a)(out)
      }
      return out
    }
})

/**
 * `Semigroup` that returns last minimum of elements.
 *
 * @category constructors
 * @since 1.0.0
 */
export const min = <A>(O: Order<A>): Semigroup<A> =>
  fromCombine((that) => (self) => O.compare(that)(self) === -1 ? self : that)

/**
 * `Semigroup` that returns last maximum of elements.
 *
 * @category constructors
 * @since 1.0.0
 */
export const max = <A>(O: Order<A>): Semigroup<A> =>
  fromCombine((that) => (self) => O.compare(that)(self) === 1 ? self : that)

/**
 * @category constructors
 * @since 1.0.0
 */
export const constant = <A>(a: A): Semigroup<A> => ({
  combine: () => () => a,
  combineMany: () => () => a
})

/**
 * The dual of a `Semigroup`, obtained by flipping the arguments of `combine`.
 *
 * @since 1.0.0
 */
export const reverse = <A>(S: Semigroup<A>): Semigroup<A> => ({
  combine: (that) => (self) => S.combine(self)(that),
  combineMany: (collection) =>
    (self) => {
      const reversed = Array.from(collection).reverse()
      return reversed.length > 0 ?
        S.combine(self)(S.combineMany(reversed.slice(1))(reversed[0])) :
        self
    }
})

/**
 * Given a struct of associatives returns an associative for the struct.
 *
 * @since 1.0.0
 */
export const struct = <A>(semigroups: { [K in keyof A]: Semigroup<A[K]> }): Semigroup<
  {
    [K in keyof A]: A[K]
  }
> =>
  fromCombine((that) =>
    (self) => {
      const r = {} as any
      for (const k in semigroups) {
        if (Object.prototype.hasOwnProperty.call(semigroups, k)) {
          r[k] = semigroups[k].combine(that[k])(self[k])
        }
      }
      return r
    }
  )

/**
 * Given a tuple of associatives returns an associative for the tuple.
 *
 * @since 1.0.0
 */
export const tuple = <A extends Array<any>>(
  ...semigroups: { [K in keyof A]: Semigroup<A[K]> }
): Semigroup<A> =>
  fromCombine((that) => (self) => semigroups.map((S, i) => S.combine(that[i])(self[i])) as any)

/**
 * @since 1.0.0
 */
export const intercalate = <A>(separator: A) =>
  (S: Semigroup<A>): Semigroup<A> =>
    fromCombine(
      (that) => S.combineMany([separator, that])
    )

/**
 * Always return the first argument.
 *
 * @category instances
 * @since 1.0.0
 */
export const first = <A = never>(): Semigroup<A> => ({
  combine: () => identity,
  combineMany: () => identity
})

/**
 * Always return the last argument.
 *
 * @category instances
 * @since 1.0.0
 */
export const last = <A = never>(): Semigroup<A> => ({
  combine: second => () => second,
  combineMany: collection =>
    self => {
      let a: A = self
      // eslint-disable-next-line no-empty
      for (a of collection) {}
      return a
    }
})

/**
 * @since 1.0.0
 */
export const imap = <A, B>(
  to: (a: A) => B,
  from: (b: B) => A
) =>
  (S: Semigroup<A>): Semigroup<B> => ({
    combine: that => self => to(S.combine(from(that))(from(self))),
    combineMany: (collection) =>
      self =>
        to(
          S.combineMany(
            (Array.isArray(collection) ? collection : Array.from(collection)).map(from)
          )(from(self))
        )
  })

/**
 * @category instances
 * @since 1.0.0
 */
export const Invariant: invariant.Invariant<SemigroupTypeLambda> = {
  imap
}

/**
 * @category instances
 * @since 1.0.0
 */
export const SemiProduct: semiProduct.SemiProduct<SemigroupTypeLambda> = {
  ...Invariant,
  product: that => self => tuple(self, that),
  productMany: collection => self => tuple(self, ...collection)
}

/**
 * @category instances
 * @since 1.0.0
 */
export const Product: product.Product<SemigroupTypeLambda> = {
  ...SemiProduct,
  of: constant,
  productAll: <A>(collection: Iterable<Semigroup<A>>) => tuple<Array<A>>(...collection)
}
