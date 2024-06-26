import type { TypeLambda } from "@fp-ts/core/HKT"
import * as contravariant from "@fp-ts/core/typeclass/Contravariant"
import * as invariant from "@fp-ts/core/typeclass/Invariant"
import * as of_ from "@fp-ts/core/typeclass/Of"
import * as product from "@fp-ts/core/typeclass/Product"
import * as semiProduct from "@fp-ts/core/typeclass/SemiProduct"

export interface Predicate<A> {
  (a: A): boolean
}

export interface PredicateTypeLambda extends TypeLambda {
  type: Predicate<this["Target"]>
}

export const contramap = <B, A>(f: (b: B) => A) =>
  (self: Predicate<A>): Predicate<B> => b => self(f(b))

export const Contravariant: contravariant.Contravariant<PredicateTypeLambda> = contravariant.make(
  contramap
)

export const Invariant: invariant.Invariant<PredicateTypeLambda> = {
  imap: Contravariant.imap
}

export const SemiProduct: semiProduct.SemiProduct<PredicateTypeLambda> = {
  imap: Contravariant.imap,
  product: that => self => ([a, b]) => self(a) && that(b),
  productMany: collection =>
    self => {
      return ([head, ...tail]) => {
        if (self(head) === false) {
          return false
        }
        const predicates = Array.from(collection)
        for (let i = 0; i < predicates.length; i++) {
          if (predicates[i](tail[i]) === false) {
            return false
          }
        }
        return true
      }
    }
}

export const of = <A>(_: A): Predicate<A> => () => true

export const Of: of_.Of<PredicateTypeLambda> = {
  of
}

export const Do = of_.Do(Of)

export const Product: product.Product<PredicateTypeLambda> = {
  ...SemiProduct,
  of,
  productAll: collection =>
    as => {
      const predicates = Array.from(collection)
      for (let i = 0; i < predicates.length; i++) {
        if (predicates[i](as[i]) === false) {
          return false
        }
      }
      return true
    }
}

export const andThenBind: <N extends string, A extends object, B>(
  name: Exclude<N, keyof A>,
  fb: Predicate<B>
) => (
  self: Predicate<A>
) => Predicate<{ [K in N | keyof A]: K extends keyof A ? A[K] : B }> = semiProduct
  .andThenBind(
    SemiProduct
  )

export const tupled: <A>(self: Predicate<A>) => Predicate<[A]> = invariant.tupled(
  Invariant
)

export const tuple = product.tuple(Product)

export const isString = (u: unknown): u is string => typeof u === "string"

export const isNumber = (u: unknown): u is number => typeof u === "number"

export const isBoolean = (u: unknown): u is boolean => typeof u === "boolean"
