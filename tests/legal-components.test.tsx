import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { ConsentBanner } from "@/components/legal/ConsentBanner";
import { Disclaimer } from "@/components/legal/Disclaimer";
import { TrustSignals } from "@/components/legal/TrustSignals";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

afterEach(() => {
  cleanup();
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string): string | null => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("ConsentBanner", () => {
  beforeEach(() => {
    cleanup();
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("renders the consent dialog when localStorage has no consent key", async () => {
    localStorageMock.getItem.mockReturnValue(null);
    render(
      <ConsentBanner>
        <div data-testid="child-content">Protected Content</div>
      </ConsentBanner>
    );
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeDefined();
      expect(screen.getByTestId("consent-accept")).toBeDefined();
    });
  });

  it("renders children directly when localStorage has consent", async () => {
    localStorageMock.getItem.mockReturnValue("true");
    render(
      <ConsentBanner>
        <div data-testid="child-content">Protected Content</div>
      </ConsentBanner>
    );
    await waitFor(() => {
      expect(screen.getByTestId("child-content")).toBeDefined();
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("stores consent in localStorage when accept is clicked", async () => {
    localStorageMock.getItem.mockReturnValue(null);
    render(
      <ConsentBanner>
        <div>Content</div>
      </ConsentBanner>
    );
    await waitFor(() => {
      expect(screen.getByTestId("consent-accept")).toBeDefined();
    });
    fireEvent.click(screen.getByTestId("consent-accept"));
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "metlife-rgpd-consent",
      "true"
    );
  });

  it("dims children with pointer-events-none when not consented", async () => {
    localStorageMock.getItem.mockReturnValue(null);
    const { container } = render(
      <ConsentBanner>
        <div>Content</div>
      </ConsentBanner>
    );
    await waitFor(() => {
      const dimmedDiv = container.querySelector(".pointer-events-none.opacity-50");
      expect(dimmedDiv).not.toBeNull();
    });
  });
});

describe("Disclaimer", () => {
  it('contains "indicatives"', () => {
    render(<Disclaimer />);
    expect(screen.getByText(/indicatives/)).toBeDefined();
  });

  it('contains "ne constituent pas un conseil en assurance"', () => {
    render(<Disclaimer />);
    expect(
      screen.getByText(/ne constituent pas un conseil en assurance/)
    ).toBeDefined();
  });
});

describe("TrustSignals", () => {
  it('contains "ACPR"', () => {
    render(<TrustSignals />);
    expect(screen.getByText(/ACPR/)).toBeDefined();
  });

  it("contains Moody's rating", () => {
    render(<TrustSignals />);
    expect(screen.getByText(/A1 \(Moody/)).toBeDefined();
  });

  it('contains "100 millions"', () => {
    render(<TrustSignals />);
    expect(screen.getByText(/100 millions/)).toBeDefined();
  });
});
