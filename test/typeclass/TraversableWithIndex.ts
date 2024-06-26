import { pipe } from "@fp-ts/core/internal/Function"
import * as RA from "../data/Array"
import * as O from "../data/Option"
import * as _ from "../limbo/TraversableWithIndex"
import * as U from "../util"

describe("TraversableWithIndex", () => {
  it("traverseWithIndexComposition", () => {
    const traverseWithIndex = _.traverseWithIndexComposition(
      RA.TraversableWithIndex,
      RA.TraversableWithIndex
    )(O.Applicative)
    U.deepStrictEqual(
      pipe(
        [["a"], ["bb"]],
        traverseWithIndex((s, [i, j]) => (s.length >= 1 ? O.some(s + i + j) : O.none))
      ),
      O.some([["a00"], ["bb10"]])
    )
    U.deepStrictEqual(
      pipe(
        [["a"], ["bb"]],
        traverseWithIndex((s, [i, j]) => (s.length > 1 ? O.some(s + i + j) : O.none))
      ),
      O.none
    )
  })

  it("traverse", () => {
    const traverse = _.traverse(RA.TraversableWithIndex)(O.Applicative)
    const f = (n: number) => n > 0 ? O.some(n) : O.none
    U.deepStrictEqual(pipe([], traverse(f)), O.some([]))
    U.deepStrictEqual(pipe([1, 2, 3], traverse(f)), O.some([1, 2, 3]))
    U.deepStrictEqual(pipe([1, -2, 3], traverse(f)), O.none)
  })
})
