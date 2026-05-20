import type { PageIR } from "@anvilkit/core/types";

export const blogListFixture: PageIR = {
  version: "1",
  root: {
    id: "root",
    type: "__root__",
    props: {},
    children: [
      {
        id: "blog-list-1",
        type: "BlogList",
        props: {
          posts: [
            {
              title: "Phase 3 fixtures",
              description: "Reusable IR examples for exporter tests.",
              href: "https://example.com/blog/phase-3-fixtures",
              imageSrc: "https://example.com/blog-list-post-1.jpg",
              imageAlt: "Editor showing a deterministic fixture preview.",
            },
          ],
        },
      },
    ],
  },
  assets: [
    {
      id: "blog-list-image-1",
      kind: "image",
      url: "https://example.com/blog-list-post-1.jpg",
    },
  ],
  metadata: {
    createdAt: "2026-04-11T00:00:00.000Z",
  },
};
