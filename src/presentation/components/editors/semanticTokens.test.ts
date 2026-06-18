import { describe, expect, it } from "vitest";
import { tokenizeManualSequence, tokenizeRiscV } from "./semanticTokens";

describe("semantic editor tokenizers", () => {
  it("classifies RISC-V labels, addresses, mnemonics, registers, immediates, and comments", () => {
    const tokens = tokenizeRiscV("loop:\n0x0c bge x6, x7, end # B1: exit loop");

    expect(tokens).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "label" }),
        expect.objectContaining({ type: "address" }),
        expect.objectContaining({ type: "mnemonic" }),
        expect.objectContaining({ type: "register" }),
        expect.objectContaining({ type: "comment" })
      ])
    );
  });

  it("classifies manual branch sequence tokens without parsing simulation data", () => {
    const tokens = tokenizeManualSequence("repeat B1 T index=0 0..1 x2 # edited");

    expect(tokens).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "keyword" }),
        expect.objectContaining({ type: "branchId" }),
        expect.objectContaining({ type: "option" }),
        expect.objectContaining({ type: "range" }),
        expect.objectContaining({ type: "repetition" }),
        expect.objectContaining({ type: "comment" })
      ])
    );
  });
});
