import { describe, expect, it } from "vitest";
import { SubscriptionPlan } from "@prisma/client";
import { defaultSeatLimit } from "./plans";

describe("defaultSeatLimit", () => {
  it("returns plan seat defaults", () => {
    expect(defaultSeatLimit(SubscriptionPlan.TRIAL)).toBe(50);
    expect(defaultSeatLimit(SubscriptionPlan.STARTER)).toBe(100);
    expect(defaultSeatLimit(SubscriptionPlan.PROFESSIONAL)).toBe(500);
    expect(defaultSeatLimit(SubscriptionPlan.ENTERPRISE)).toBe(5000);
  });
});
