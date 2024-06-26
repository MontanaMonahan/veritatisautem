import { pipe } from "@fp-ts/core/internal/Function"
import * as RA from "../data/Array"
import * as _ from "../limbo/CovariantWithIndex"
import * as U from "../util"

describe("FunctorWithIndex", () => {
  it("mapWithIndexComposition", () => {
    const mapWithIndex = _.mapWithIndexComposition(RA.CovariantWithIndex, RA.CovariantWithIndex)
    const f = (a: string, [i, j]: [number, number]) => a + i + j
    U.deepStrictEqual(pipe([], mapWithIndex(f)), [])
    U.deepStrictEqual(pipe([[]], mapWithIndex(f)), [[]])
    U.deepStrictEqual(pipe([["a"]], mapWithIndex(f)), [["a00"]])
    U.deepStrictEqual(pipe([["a"], ["b"]], mapWithIndex(f)), [["a00"], ["b10"]])
    U.deepStrictEqual(pipe([["a", "c"], ["b", "d", "e"]], mapWithIndex(f)), [["a00", "c01"], [
      "b10",
      "d11",
      "e12"
    ]])
  })

  it("map", () => {
    const map = _.map(RA.CovariantWithIndex)
    const f = (a: string) => a + "!"
    U.deepStrictEqual(pipe([], map(f)), [])
    U.deepStrictEqual(pipe(["a", "b", "c"], map(f)), ["a!", "b!", "c!"])
  })
})
