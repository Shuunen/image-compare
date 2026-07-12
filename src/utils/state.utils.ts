import { createState, storage } from 'shuutils'

storage.prefix = 'image-compare_'

export const { state } = createState(
  {
    darkTheme: true,
  },
  storage,
  ['darkTheme'],
)
