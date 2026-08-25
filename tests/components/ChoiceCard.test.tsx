import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChoiceCard } from "@/components/controls/ChoiceCard";

describe("ChoiceCard", () => {
  it("renders radio semantics when as='radio', regardless of label wording", () => {
    render(
      <ChoiceCard as="radio" name="test" value="a" checked={false} onChange={() => {}} label="Choose many things" />,
    );
    expect(screen.getByRole("radio")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("renders checkbox semantics when as='checkbox', regardless of label wording", () => {
    render(
      <ChoiceCard as="checkbox" name="test" value="a" checked={false} onChange={() => {}} label="Pick exactly one" />,
    );
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("calls onChange with the new checked value on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ChoiceCard as="checkbox" name="test" value="a" checked={false} onChange={onChange} label="Option" />);
    await user.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("marks the tile selected via data-selected, reflecting the checked prop", () => {
    const { container } = render(
      <ChoiceCard as="checkbox" name="test" value="a" checked={true} onChange={() => {}} label="Option" />,
    );
    expect(container.querySelector('[data-selected="true"]')).toBeInTheDocument();
  });
});
