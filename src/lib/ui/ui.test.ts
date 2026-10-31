// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/svelte";
import GradientButton from "./GradientButton.svelte";

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
});
