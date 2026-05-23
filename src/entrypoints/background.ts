import { registerBackgroundListeners } from '@/background';

export default defineBackground({
  type: 'module',
  main() {
    registerBackgroundListeners();
  },
});
