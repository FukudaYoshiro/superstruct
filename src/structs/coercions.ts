import { Struct, is } from '../struct'
import { isPlainObject } from '../utils'
import { string, unknown } from './types'

/**
 * Augment a `Struct` to add an additional coercion step to its input.
 *
 * This allows you to transform input data before validating it, to increase the
 * likelihood that it passes validation—for example for default values, parsing
 * different formats, etc.
 *
 * Note: You must use `create(value, Struct)` on the value to have the coercion
 * take effect! Using simply `assert()` or `is()` will not use coercion.
 */

export function coerce<T, S, C>(
  struct: Struct<T, S>,
  condition: Struct<C, any>,
  coercer: (value: C) => any
): Struct<T, S> {
  const fn = struct.coercer
  return new Struct({
    ...struct,
    coercer: (value) => {
      if (is(value, condition)) {
        return fn(coercer(value))
      } else {
        return fn(value)
      }
    },
  })
}

/**
 * Augment a struct to replace `undefined` values with a default.
 *
 * Note: You must use `create(value, Struct)` on the value to have the coercion
 * take effect! Using simply `assert()` or `is()` will not use coercion.
 */

export function defaulted<T, S>(
  S: Struct<T, S>,
  fallback: any,
  options: {
    strict?: boolean
  } = {}
): Struct<T, S> {
  const { strict } = options
  return coerce(S, unknown(), (x) => {
    const f = typeof fallback === 'function' ? fallback() : fallback

    if (x === undefined) {
      return f
    }

    if (!strict && isPlainObject(x) && isPlainObject(f)) {
      const ret = { ...x }
      let changed = false

      for (const key in f) {
        if (ret[key] === undefined) {
          ret[key] = f[key]
          changed = true
        }
      }

      if (changed) {
        return ret
      }
    }

    return x
  })
}

/**
 * Augment a struct to mask its input to only properties defined in the struct.
 *
 * Note: You must use `create(value, Struct)` on the value to have the coercion
 * take effect! Using simply `assert()` or `is()` will not use coercion.
 */

export function masked<T, S>(struct: Struct<T, S>): Struct<T, S> {
  return coerce(struct, unknown(), (x) => {
    if (
      typeof struct.schema !== 'object' ||
      struct.schema == null ||
      typeof x !== 'object' ||
      x == null
    ) {
      return x
    } else {
      const ret: any = {}

      for (const key in struct.schema) {
        if (key in x) {
          ret[key] = (x as any)[key]
        }
      }

      return ret
    }
  })
}

/**
 * Augment a struct to trim string inputs.
 *
 * Note: You must use `create(value, Struct)` on the value to have the coercion
 * take effect! Using simply `assert()` or `is()` will not use coercion.
 */

export function trimmed<T, S>(struct: Struct<T, S>): Struct<T, S> {
  return coerce(struct, string(), (x) => x.trim())
}
