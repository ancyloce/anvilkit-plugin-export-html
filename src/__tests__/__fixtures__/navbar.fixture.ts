import type { PageIR } from "@anvilkit/core/types";

export const navbarFixture: PageIR = {
  version: "1",
  root: {
    id: "root",
    type: "__root__",
    props: {},
    children: [
      {
        id: "navbar-1",
        type: "Navbar",
        props: {
          logo: {
            text: "Anvilkit",
            href: "https://example.com/home",
          },
          items: [
            { label: "Docs", href: "https://example.com/docs" },
            { label: "Pricing", href: "https://example.com/pricing" },
          ],
          actions: [
            {
              label: "Start trial",
              href: "https://example.com/start",
              variant: "primary",
            },
          ],
          active: "https://example.com/docs",
        },
      },
    ],
  },
  assets: [],
  metadata: {
    createdAt: "2026-04-11T00:00:00.000Z",
  },
};
