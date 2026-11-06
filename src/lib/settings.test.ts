// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/svelte";
import Settings from "./Settings.svelte";
import { ds } from "./datastore";

describe("Settings.svelte", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    ds.locConf = {
      style: "https://tile.openstreetmap.jp/styles/osm-bright-ja/style.json",
      zoom: 2,
      center: "139.75,35.68",
      iconSize: 24,
    };
    vi.spyOn(ds, "saveLocConf").mockImplementation(async () => {});
  });

  afterEach(() => {
    cleanup();
  });

  it("renders when open", () => {
    const { getByText, getByPlaceholderText, queryByText } = render(Settings, {
      props: {
        show: true,
      },
    });

    expect(getByText("地図設定")).toBeDefined();
    expect(getByText("緯度")).toBeDefined();
    expect(getByText("経度")).toBeDefined();
    expect(getByText("ズーム")).toBeDefined();
    expect(getByText("アイコンサイズ")).toBeDefined();
    expect(getByPlaceholderText("https://... または { ... }")).toBeDefined();
    // キャンセルボタンが存在しないこと
    expect(queryByText("キャンセル")).toBeNull();
    // 保存のテキストが存在しないこと
    expect(queryByText("保存")).toBeNull();
  });

  it("updates and saves valid map configuration with separate lat and lng", async () => {
    const { getByLabelText, container } = render(Settings, {
      props: {
        show: true,
      },
    });

    const zoomInput = getByLabelText("ズーム") as HTMLInputElement;
    await fireEvent.input(zoomInput, { target: { value: "5" } });

    const latInput = getByLabelText("緯度") as HTMLInputElement;
    await fireEvent.input(latInput, { target: { value: "34.69" } });

    const lngInput = getByLabelText("経度") as HTMLInputElement;
    await fireEvent.input(lngInput, { target: { value: "135.50" } });

    const saveButton = container.querySelector("#save-settings-btn") as HTMLButtonElement;
    await fireEvent.click(saveButton);

    expect(ds.locConf.zoom).toBe(5);
    expect(ds.locConf.center).toBe("135.50,34.69");
    expect(ds.saveLocConf).toHaveBeenCalled();
  });

  it("shows error when invalid JSON style is entered", async () => {
    const { getByPlaceholderText, container, getByText } = render(Settings, {
      props: {
        show: true,
      },
    });

    const textarea = getByPlaceholderText("https://... または { ... }") as HTMLTextAreaElement;
    await fireEvent.input(textarea, { target: { value: "{ invalid_json " } });

    const saveButton = container.querySelector("#save-settings-btn") as HTMLButtonElement;
    await fireEvent.click(saveButton);

    expect(getByText("スタイルは、URLかJSONで指定してください。")).toBeDefined();
    expect(ds.saveLocConf).not.toHaveBeenCalled();
  });

  it("applies preset style when selected", async () => {
    const { getAllByRole, getByPlaceholderText } = render(Settings, {
      props: {
        show: true,
      },
    });

    const selects = getAllByRole("combobox") as HTMLSelectElement[];
    // Select option 1 (国土地理院 淡色地図) on preset select
    await fireEvent.change(selects[0], { target: { value: "1" } });

    const textarea = getByPlaceholderText("https://... または { ... }") as HTMLTextAreaElement;
    expect(textarea.value).toContain("cyberjapandata.gsi.go.jp");
  });
});
