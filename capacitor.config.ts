import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'org.openguitar.app',
  appName: 'OpenGuitar',
  webDir: 'dist',
  server: { androidScheme: 'https' },
}
export default config
