// oxlint-disable id-length
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Paragraph } from '../components/ui/paragraph'
import { Title } from '../components/ui/title'
import { logger } from '../utils/logger.utils'
import { state } from '../utils/state.utils'
import { setDarkTheme } from '../utils/theme.utils'

export function Settings() {
  const [isDarkTheme, setIsDarkTheme] = useState(state.darkTheme)
  /* v8 ignore start */
  function onDarkThemeChange(checked: boolean) {
    if (state.darkTheme === checked) return
    state.darkTheme = checked
    setIsDarkTheme(checked)
    setDarkTheme(checked)
    logger.info({ darkTheme: checked })
    logger.showSuccess('Settings updated successfully.')
  }
  /* v8 ignore stop */
  return (
    <motion.div animate={{ opacity: 1 }} className="flex min-h-screen flex-col items-center justify-center gap-4 bg-accent" data-testid="settings-tab" initial={{ opacity: 0 }} transition={{ duration: 0.4 }}>
      <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: -20 }} transition={{ delay: 0.1, duration: 0.4 }}>
        <Title>Settings</Title>
      </motion.div>
      <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ delay: 0.2, duration: 0.4 }}>
        <Paragraph>You can adjust your preferences here.</Paragraph>
      </motion.div>
      <label className="flex items-center gap-2">
        <input checked={isDarkTheme} onChange={event => onDarkThemeChange(event.target.checked)} type="checkbox" />
        Dark Theme
      </label>
    </motion.div>
  )
}
