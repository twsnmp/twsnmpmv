// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/svelte";
import GradientButton from "./GradientButton.svelte";
import KPICard from "./KPICard.svelte";
import Modal from "./Modal.svelte";

describe("UI Components", () => {
  it("renders GradientButton with text", () => {
    const { getByRole } = render(GradientButton, {
      props: {
        color: "blue",
      },
    });
    const btn = getByRole("button");
    expect(btn).toBeDefined();
    expect(btn.className).toContain("bg-gradient-to-r");
  });

  it("renders KPICard with value and title", () => {
    const { getByText } = render(KPICard, {
      props: {
        title: "総アドレス数",
        value: "256",
        unit: "個",
        subText: "テスト用",
        color: "cyan",
      },
    });
    expect(getByText("総アドレス数")).toBeDefined();
    expect(getByText("256")).toBeDefined();
    expect(getByText("個")).toBeDefined();
    expect(getByText("テスト用")).toBeDefined();
  });

  it("calls onopen only once when Modal opens", async () => {
    let callCount = 0;
    const { rerender } = render(Modal, {
      props: {
        open: true,
        title: "Test Modal",
        onopen: () => {
          callCount++;
        },
      },
    });
    expect(callCount).toBe(1);

    // Re-render modal while still open with new callback reference
    await rerender({
      open: true,
      title: "Test Modal Updated",
      onopen: () => {
        callCount++;
      },
    });
    // Should still be 1, NOT incremented
    expect(callCount).toBe(1);
  });
});
