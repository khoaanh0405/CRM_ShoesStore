import { useCallback, useEffect, useState } from 'react';

/** Đếm ngược chống gửi liên tục, lưu localStorage nên F5 không reset. */
export function useCooldown(key: string, defaultSeconds = 60) {
  const storageKey = `crm_shoesstore.cooldown.${key}`;
  const calc = () => Math.max(0, Math.ceil((Number(localStorage.getItem(storageKey) ?? 0) - Date.now()) / 1000));
  const [remaining, setRemaining] = useState(calc);

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => setRemaining(calc()), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining > 0]);

  const start = useCallback((seconds = defaultSeconds) => {
    localStorage.setItem(storageKey, String(Date.now() + seconds * 1000));
    setRemaining(seconds);
  }, [storageKey, defaultSeconds]);

  return { remaining, start };
}