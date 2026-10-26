const limit = (raw: string | undefined, fallback: number) => {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : fallback;
};

/** Per client IP and minute. Sign-in style endpoints get a tight budget to slow password guessing. */
export const AUTH_THROTTLE = { default: { limit: limit(process.env.AUTH_RATE_LIMIT, 10), ttl: 60_000 } };

export const DEFAULT_THROTTLE = { name: "default", limit: limit(process.env.API_RATE_LIMIT, 300), ttl: 60_000 };
