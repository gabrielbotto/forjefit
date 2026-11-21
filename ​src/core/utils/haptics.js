export const Haptics = {
  light() {
    if (window.Capacitor?.Plugins?.Haptics) {
      window.Capacitor.Plugins.Haptics.impact({ style: 'LIGHT' }).catch(() => {});
      return;
    }
    if (navigator.vibrate) navigator.vibrate(12);
  },
  medium() {
    if (window.Capacitor?.Plugins?.Haptics) {
      window.Capacitor.Plugins.Haptics.impact({ style: 'MEDIUM' }).catch(() => {});
      return;
    }
    if (navigator.vibrate) navigator.vibrate(25);
  },
  success() {
    if (window.Capacitor?.Plugins?.Haptics) {
      window.Capacitor.Plugins.Haptics.notification({ type: 'SUCCESS' }).catch(() => {});
      return;
    }
    if (navigator.vibrate) navigator.vibrate([20, 40, 35]);
  },
  warning() {
    if (navigator.vibrate) navigator.vibrate([35, 30, 35]);
  }
};
