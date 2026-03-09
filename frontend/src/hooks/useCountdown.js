import { useState, useEffect } from "react";

/**
 * Returns { days, hours, minutes, seconds, isExpired, isUrgent }
 * isUrgent = true when < 5 minutes remaining
 */
export function useCountdown(endTime) {
  const calcRemaining = () => {
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0)
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
        isUrgent: false,
        totalMs: 0,
      };

    const totalMs = diff;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    const isUrgent = totalMs < 5 * 60 * 1000; // < 5 minutes
    return {
      days,
      hours,
      minutes,
      seconds,
      isExpired: false,
      isUrgent,
      totalMs,
    };
  };

  const [remaining, setRemaining] = useState(calcRemaining);

  useEffect(() => {
    if (!endTime) return;
    setRemaining(calcRemaining());

    const interval = setInterval(() => {
      const r = calcRemaining();
      setRemaining(r);
      if (r.isExpired) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  return remaining;
}
