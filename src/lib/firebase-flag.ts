import { getEnv } from './env'

export const useFirebase = getEnv('VITE_USE_FIREBASE') === 'true'
