import { describe, expect, it } from "vitest";
import { lemmatize, tokenize, tokenizeLines, toLines } from "../tokenize";

describe("tokenize", () => {
  it("lowercases, strips punctuation, short tokens, numbers and stopwords", () => {
    expect(tokenize("The Network, of 2024 graphs: is AI-driven!")).toEqual(["network", "graph", "driven"]);
  });

  it("removes Indonesian stopwords", () => {
    expect(tokenize("Analisis data yang dilakukan oleh tim untuk perusahaan")).toEqual(["analisis", "data", "tim", "perusahaan"]);
  });

  it("keeps unicode letters", () => {
    expect(tokenize("café naïve résumé")).toEqual(["café", "naïve", "résumé"]);
  });
});

describe("lemmatize", () => {
  it("applies the simple plural rules", () => {
    expect(lemmatize("stories")).toBe("story");
    expect(lemmatize("graphs")).toBe("graph");
    expect(lemmatize("class")).toBe("class");
    expect(lemmatize("status")).toBe("status");
    expect(lemmatize("analysis")).toBe("analysis");
    expect(lemmatize("famous")).toBe("famous");
  });

  it("leaves protected words alone", () => {
    expect(lemmatize("atlas")).toBe("atlas");
    expect(lemmatize("kualitas")).toBe("kualitas");
    expect(lemmatize("gas")).toBe("gas");
  });
});

describe("lines", () => {
  it("splits on newlines and keeps the source id", () => {
    expect(toLines([{ text: "a\nb", sourceId: "x" }])).toEqual([{ text: "a", sourceId: "x" }, { text: "b", sourceId: "x" }]);
  });

  it("drops lines without usable tokens", () => {
    expect(tokenizeLines("the and\nnetwork graph")).toEqual([{ tokens: ["network", "graph"], sourceId: undefined }]);
  });
});
