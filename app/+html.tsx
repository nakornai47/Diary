import React, { type PropsWithChildren } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <title>Diary</title>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Diary" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/Diary/apple-touch-icon.png" />
        <ScrollViewStyleReset />
        <style id="expo-reset">
          {`
            html, body { height: 100%; }
            body { overflow: hidden; }
            #root { display: flex; height: 100%; flex: 1; }
          `}
        </style>
      </head>
      <body>{children}</body>
    </html>
  );
}
