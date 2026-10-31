import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// No vitest globals here, so RTL cannot register its own cleanup.
afterEach(() => cleanup())
