/**
 * @since 1.0.0
 */
import type { Kind, TypeLambda } from "@fp-ts/core/HKT"
import type { Extendable } from "@fp-ts/core/test/limbo/Extendable"

/**
 * @category type class
 * @since 1.0.0
 */
export interface Comonad<F extends TypeLambda> extends Extendable<F> {
  extract: <R, O, E, A>(self: Kind<F, R, O, E, A>) => A
}
