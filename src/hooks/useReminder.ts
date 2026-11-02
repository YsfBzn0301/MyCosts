import { useEffect, useState } from 'react';
import type { ReminderConfig, ReminderState } from '../agents/reminderAgent';
import { loadReminderConfig, loadReminderState, saveReminderConfig, saveReminderState } from '../storage/reminderRepository';

export type NotifyPermission = NotificationPermission | 'unsupported';

export function currentPermission(): NotifyPermission {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
}

/** Einstellungen und Monatszustand der Erinnerung. Persistiert auf dem Gerät. */
export function useReminder() {
  const [config, setConfig] = useState<ReminderConfig>(() => loadReminderConfig());
  const [state, setState] = useState<ReminderState>(() => loadReminderState());
  const [permission, setPermission] = useState<NotifyPermission>(() => currentPermission());

  useEffect(() => void saveReminderConfig(config), [config]);
  useEffect(() => void saveReminderState(state), [state]);

  /** Muss aus einer Nutzeraktion heraus aufgerufen werden, sonst blockiert der Browser die Abfrage. */
  async function requestPermission(): Promise<void> {
    if (typeof Notification === 'undefined') return setPermission('unsupported');
    const result = await Notification.requestPermission();
    setPermission(result);
  }

  return { config, setConfig, state, setState, permission, requestPermission };
}

/** Zeigt eine System-Benachrichtigung über den Service Worker, sonst über die Notification API. */
export async function showSystemNotification(title: string, body: string): Promise<void> {
  if (currentPermission() !== 'granted') return;
  const options: NotificationOptions = { body, tag: 'fixkosten-reminder', icon: './icon-192.png', badge: './icon-192.png' };
  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg) {
      await reg.showNotification(title, options);
      return;
    }
  } catch {
    /* weiter mit dem Fallback */
  }
  try {
    new Notification(title, options);
  } catch {
    /* Gerät verweigert die Anzeige, dann bleibt nur das Banner */
  }
}
