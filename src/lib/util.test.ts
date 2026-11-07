import { describe, it, expect } from "vitest";
import { toHalfWidth } from "./util";

describe("toHalfWidth", () => {
  it("converts full-width alphanumeric to half-width", () => {
    expect(toHalfWidth("ｈｔｔｐ：／／１９２．１６８．１．１：８０８０")).toBe("http://192.168.1.1:8080");
    expect(toHalfWidth("ａｄｍｉｎ＿ｕｓｅｒ")).toBe("admin_user");
    expect(toHalfWidth("Ｐａｓｓｗｏｒｄ１２３！")).toBe("Password123!");
  });

  it("converts full-width dashes and prolonged sound marks to hyphens", () => {
    expect(toHalfWidth("ｔｗｓｎｍｐーｍｖ")).toBe("twsnmp-mv");
    expect(toHalfWidth("ｓｅｒｖｅｒ―０１")).toBe("server-01");
  });

  it("converts full-width spaces to half-width spaces", () => {
    expect(toHalfWidth("ｈｅｌｌｏ　ｗｏｒｌｄ")).toBe("hello world");
  });

  it("leaves standard half-width text untouched", () => {
    expect(toHalfWidth("http://example.com")).toBe("http://example.com");
    expect(toHalfWidth("admin")).toBe("admin");
  });

  it("handles empty or falsy strings gracefully", () => {
    expect(toHalfWidth("")).toBe("");
  });
});
