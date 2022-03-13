export const scenePlayer = async (framesList, streamer, delay) => {
  for (const options of framesList) {
    const { before, after, delays, frames, repeat = 1 } = options;
    if (before) await delay?.(before);
    for (let r = 0; r < repeat; ++r)
      for (let i = 0, u = 0; i < frames.length; ++i, ++u) {
        await streamer?.(frames[i]);
        if (!delays) continue;
        if (u >= delays.length) u = 0;
        if (repeat > 1 || i < frames.length - 1) await delay?.(delays[u]);
      }
    if (after) await delay?.(after);
  }
};
