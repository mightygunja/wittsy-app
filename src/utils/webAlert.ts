/**
 * Web shim for React Native's Alert.
 *
 * react-native-web ships Alert.alert as a NO-OP, so every validation message,
 * error dialog, and confirm prompt in the app silently vanishes on web.
 * This patches Alert.alert with a window.alert/confirm implementation that
 * honours button callbacks. Call installWebAlert() once at startup.
 */
import { Alert, AlertButton, Platform } from 'react-native';

export function installWebAlert(): void {
  if (Platform.OS !== 'web') return;

  (Alert as any).alert = (
    title?: string,
    message?: string,
    buttons?: AlertButton[]
  ): void => {
    const text = [title, message].filter(Boolean).join('\n\n');

    if (!buttons || buttons.length <= 1) {
      window.alert(text);
      buttons?.[0]?.onPress?.();
      return;
    }

    // Multi-button: confirm() gives us OK/Cancel. Map Cancel to the
    // style:'cancel' button and OK to the primary (last non-cancel) button.
    const cancelButton = buttons.find(b => b.style === 'cancel') || buttons[0];
    const primaryButton =
      [...buttons].reverse().find(b => b !== cancelButton) || buttons[buttons.length - 1];

    const confirmed = window.confirm(
      `${text}\n\n[OK = ${primaryButton.text || 'OK'} / Cancel = ${cancelButton.text || 'Cancel'}]`
    );
    (confirmed ? primaryButton : cancelButton).onPress?.();
  };
}
