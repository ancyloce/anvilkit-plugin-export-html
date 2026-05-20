import type { PageIR } from "@anvilkit/core/types";

export const helpsFixture: PageIR = {
  version: "1",
  root: {
    id: "root",
    type: "__root__",
    props: {},
    children: [
      {
        id: "helps-1",
        type: "Helps",
        props: {
          message: "The export team is online and ready to help.",
          buttonLabel: "Contact support",
          buttonHref: "https://example.com/support",
          avatars: [
            { name: "Rae Chen", initials: "RC" },
            { name: "Jon Patel", initials: "JP" },
          ],
        },
      },
    ],
  },
  assets: [],
  metadata: {
    createdAt: "2026-04-11T00:00:00.000Z",
  },
};
