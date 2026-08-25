import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ThemeSwatch } from "@/components/controls/ThemeSwatch";
import { getTheme } from "@/lib/theme/themes";

describe("ThemeSwatch", () => {
  it("exposes radio semantics and reports theme + tap origin, without touching the DOM theme itself", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const theme = getTheme("aubergine");
    const before = document.documentElement.style.getPropertyValue("--accent");

    render(<ThemeSwatch theme={theme} checked={false} onSelect={onSelect} />);
    await user.click(screen.getByRole("radio"));

    expect(onSelect).toHaveBeenCalledTimes(1);
    const [calledTheme, origin] = onSelect.mock.calls[0];
    expect(calledTheme.id).toBe("aubergine");
    expect(typeof origin.x).toBe("number");
    expect(typeof origin.y).toBe("number");

    // Component contract (section 17): ThemeSwatch must not apply the root theme by itself.
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe(before);
  });

  it("shows the theme's display name", () => {
    const theme = getTheme("burnished-gold");
    render(<ThemeSwatch theme={theme} checked={false} onSelect={() => {}} />);
    expect(screen.getByText("Burnished Gold")).toBeInTheDocument();
  });
});
