import { WORKFLOWS, canTransition, type Workflow } from "@bsc/shared";
import { assertTransition } from "./workflow";

describe("workflows", () => {
  it.each(Object.entries(WORKFLOWS as Record<string, Workflow>))("%s only targets declared states", (_key, workflow) => {
    const states = new Set(Object.keys(workflow.transitions));
    expect(states.has(workflow.initial)).toBe(true);
    for (const targets of Object.values(workflow.transitions)) for (const target of targets) expect(states.has(target)).toBe(true);
  });

  it("allows declared moves and rejects others", () => {
    expect(canTransition("invoice", "DRAFT", "ISSUED")).toBe(true);
    expect(canTransition("invoice", "PAID", "DRAFT")).toBe(false);
    expect(() => assertTransition("invoice", "VOID", "PAID")).toThrow("Cannot move VOID to PAID");
  });
});
