import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface IdempotencyHandle {
  key?: string;
  markReplayed: () => void;
}

/** Reads the header without putting the Express response through the validation pipe. */
export const Idempotency = createParamDecorator((_: unknown, ctx: ExecutionContext): IdempotencyHandle => {
  const req = ctx.switchToHttp().getRequest();
  const raw = req.headers["idempotency-key"];
  const key = Array.isArray(raw) ? raw[0] : raw;
  return {
    key,
    markReplayed() {
      req.res?.setHeader("Idempotent-Replayed", "true");
    },
  };
});

export function replay<T>(handle: IdempotencyHandle, result: { body: T; replayed: boolean }) {
  if (result.replayed) handle.markReplayed();
  return result.body;
}
