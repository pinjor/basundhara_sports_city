import { BadRequestException } from "@nestjs/common";
import { canTransition, WORKFLOWS, type Workflow } from "@bsc/shared";

export function workflowOf(key: string): Workflow {
  const workflow = (WORKFLOWS as Record<string, Workflow>)[key];
  if (!workflow) throw new Error(`Unknown workflow "${key}"`);
  return workflow;
}

export function assertTransition(workflow: string, from: string, to: string): void {
  if (!canTransition(workflow, from, to)) throw new BadRequestException(`Cannot move ${from} to ${to}`);
}
