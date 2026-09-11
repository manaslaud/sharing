import { describe, expect, it } from "vitest";
import { summarizeRevisionChange } from "./content";

describe("summarizeRevisionChange", () => {
  it("describes a title rename", () => {
    expect(
      summarizeRevisionChange(
        { title: "Groceries", text: "milk" },
        { title: "Shopping list", text: "milk" },
      ),
    ).toEqual({
      label: "Next version renamed to “Shopping list”",
      tooltip:
        "After this snapshot, the title changed from “Groceries” to “Shopping list”.",
    });
  });

  it("describes text appended after the snapshot", () => {
    expect(
      summarizeRevisionChange(
        { title: "List", text: "milk eggs" },
        { title: "List", text: "milk eggs bread" },
      ),
    ).toEqual({
      label: "Next version added “bread”",
      tooltip:
        "After this snapshot, the next version added “bread”. This card is how the note looked before that change.",
    });
  });

  it("names the current note when comparing the newest snapshot", () => {
    expect(
      summarizeRevisionChange(
        { title: "List", text: "milk eggs" },
        { title: "List", text: "milk eggs bread" },
        "current",
      ),
    ).toEqual({
      label: "Next version added “bread”",
      tooltip:
        "After this snapshot, the current note added “bread”. This card is how the note looked before that change.",
    });
  });

  it("describes text that was removed after this snapshot", () => {
    expect(
      summarizeRevisionChange(
        { title: "List", text: "milk eggs bread" },
        { title: "List", text: "milk eggs" },
      ),
    ).toEqual({
      label: "Next version removed “bread”",
      tooltip:
        "After this snapshot, the next version removed “bread”. Restore this card to bring that text back.",
    });
  });

  it("falls back when the change is not a prefix or suffix", () => {
    expect(
      summarizeRevisionChange(
        { title: "Note", text: "alpha beta gamma" },
        { title: "Note", text: "something else entirely" },
      ),
    ).toEqual({
      label: "Next version rewrote the body",
      tooltip:
        "The next version replaced this wording with different text. The preview above is this snapshot.",
    });
  });

  it("combines a title change with a body addition", () => {
    expect(
      summarizeRevisionChange(
        { title: "Draft", text: "hello" },
        { title: "Final", text: "hello world" },
      ),
    ).toEqual({
      label: "Next version renamed to “Final” · added “world”",
      tooltip:
        "After this snapshot, the title changed from “Draft” to “Final”. After this snapshot, the next version added “world”. This card is how the note looked before that change.",
    });
  });

  it("returns null when title and body match the later version", () => {
    expect(
      summarizeRevisionChange(
        { title: "Same", text: "unchanged" },
        { title: "Same", text: "unchanged" },
      ),
    ).toBeNull();
  });

  it("treats blank titles as Untitled", () => {
    expect(
      summarizeRevisionChange(
        { title: "  ", text: "body" },
        { title: "Named", text: "body" },
      ),
    ).toEqual({
      label: "Next version renamed to “Named”",
      tooltip:
        "After this snapshot, the title changed from “Untitled” to “Named”.",
    });
  });
});
