import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'

describe('monorepo scaffold', () => {
  it('pnpm -r build exits 0', () => {
    expect(() => execSync('pnpm -r build', { cwd: process.cwd(), stdio: 'pipe' })).not.toThrow()
  })
})
