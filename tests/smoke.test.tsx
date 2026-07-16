import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import Home from "@/app/page";

it("renders the recorder entry point", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { name: /record\. share\. done\./i })).toBeInTheDocument();
});
