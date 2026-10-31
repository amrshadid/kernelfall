import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@shared/styles/theme.css'
import { configureCore } from '@kernelfall/core'
import { configureGame } from '@kernelfall/game'
import { appContent } from '@kernelfall/levels/utils'
import { configureMachine } from '@kernelfall/machine'
import { configureTheme } from '@kernelfall/theme'
import { pageStorage, storageAdapter } from '@shared/utils/storage'
import { App } from './App'

// Every package is configured before the first render, so nothing reads a config that isn't set yet.
configureCore({ logEvents: import.meta.env.DEV ? {} : false })
configureMachine({ vmBaseUrl: `${import.meta.env.BASE_URL}vm/` })
configureTheme()
const content = appContent()
// Invalid content never reaches the game: the router shows its errors instead.
if (content.ok) {
  configureGame({ storage: storageAdapter(pageStorage().text), content: content.value.game })
}

const root = document.getElementById('root')
if (!root) {
  throw new Error('index.html is missing the #root element')
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)
