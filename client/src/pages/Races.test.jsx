// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Races from "./Races.jsx";

const racesMocks = vi.hoisted(() => {
  return {
    actions: {
      byYear: vi.fn(),
    },
    hooks: {
      useRacesByYear: vi.fn(),
    },
  };
});

const notificationMocks = vi.hoisted(() => {
  return {
    hooks: {
      useTimerRunning: vi.fn(),
    },
  };
});

vi.mock("../services/races.js", () => racesMocks);
vi.mock("../services/notifications.js", () => notificationMocks);
vi.mock("../components/Race.jsx", () => {
  return {
    default: ({ race }) => <div>{race.name}</div>,
  };
});
vi.mock("../components/Progress.jsx", () => {
  return {
    default: () => <div>Loading</div>,
  };
});

describe("Races page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    racesMocks.hooks.useRacesByYear.mockReturnValue([
      { race_id: 1, name: "Australian Grand Prix" },
    ]);
    notificationMocks.hooks.useTimerRunning.mockReturnValue(false);
  });

  it("uses the current year as the search upper bound", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Races />
      </MemoryRouter>,
    );

    expect(screen.getByRole("spinbutton")).toHaveAttribute(
      "max",
      String(new Date().getFullYear()),
    );
  });

  it("submits a numeric year search", async () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Races />
      </MemoryRouter>,
    );

    const input = screen.getByRole("spinbutton");
    const form = container.querySelector("form");

    fireEvent.change(input, { target: { value: "2022" } });
    fireEvent.submit(form);

    expect(racesMocks.actions.byYear).toHaveBeenCalledWith(2022);
  });
});
