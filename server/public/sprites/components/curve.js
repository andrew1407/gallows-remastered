export const evaluateCurve = (keys, time) => {
  const first = keys[0];
  const last = keys.at(-1);
  if (time <= first.time) return first.value;
  if (time >= last.time) return last.value;
  const i = keys.findIndex(k => k.time > time);
  const a = keys[i - 1];
  const b = keys[i];
  const dt = b.time - a.time;
  const t = (time - a.time) / dt;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * a.value + (t3 - 2 * t2 + t) * a.slope * dt +
    (3 * t2 - 2 * t3) * b.value + (t3 - t2) * b.slope * dt;
};
