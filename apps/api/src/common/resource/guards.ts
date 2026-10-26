import { BadRequestException } from "@nestjs/common";
import type { Row } from "./resource-mapper";

/** Posted documents are immutable: edits are only allowed while the record is in one of `statuses`. */
export function assertEditable(row: Row | undefined, statuses: readonly string[]): void {
  if (row && !statuses.includes(row.status)) {
    throw new BadRequestException(`${row.reference} is ${row.status} and can no longer be edited`);
  }
}

export function fail(message: string): never {
  throw new BadRequestException(message);
}
