import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

const themeBootScript = `
(function(){try{
  var k='ns-theme';
  var v=localStorage.getItem(k);
  if(v!=='light'&&v!=='dark'){
    v=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  }
  document.documentElement.setAttribute('data-theme',v);
  document.documentElement.style.colorScheme=v;
}catch(e){}})();
`;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl">404</h1>
        <h2 className="mt-2 text-lg">Page not found</h2>
        <p className="mt-2 text-sm text-text-muted">
          The page you're looking for doesn't exist.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-text-primary px-4 py-2 text-sm font-medium text-text-inverse"
        >
          Go home
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Nano Syllabus — AI Study Companion for Nepal" },
      {
        name: "description",
        content:
          "Bilingual AI study companion bespoke to Nepal's curriculum. Ask in English or Roman Nepali — get NEB, TU, PU & KU aligned answers.",
      },
      { property: "og:title", content: "Nano Syllabus — AI Study Companion for Nepal" },
      {
        property: "og:description",
        content: "Curriculum-aligned AI tutoring for NEB, TU, PU and KU students.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Nano Syllabus — AI Study Companion for Nepal" },
      { name: "description", content: "Nepal Study Buddy is an AI-powered EdTech platform designed for Nepal's curriculum, offering bilingual chat and study tools." },
      { property: "og:description", content: "Nepal Study Buddy is an AI-powered EdTech platform designed for Nepal's curriculum, offering bilingual chat and study tools." },
      { name: "twitter:description", content: "Nepal Study Buddy is an AI-powered EdTech platform designed for Nepal's curriculum, offering bilingual chat and study tools." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0761c00e-0f7e-4266-915b-50f4256df205/id-preview-7c27fb4e--43e4e82f-3530-4313-81ce-60c736168486.lovable.app-1776490819840.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0761c00e-0f7e-4266-915b-50f4256df205/id-preview-7c27fb4e--43e4e82f-3530-4313-81ce-60c736168486.lovable.app-1776490819840.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: () => <Outlet />,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
