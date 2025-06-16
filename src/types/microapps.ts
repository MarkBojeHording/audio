export const MICRO_APPS = {
  // ... existing apps
  audioChambers: {
    id: 'audioChambers',
    name: 'Audio Chambers',
    description: 'Audio recording and audiobook production',
    icon: 'Headphones', // Valid lucide-react icon
    port: 5003,
    remoteName: 'audioChambers',
    exposedModule: './AudioChambers',
    status: 'available',
  },
};