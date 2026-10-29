---
name: Velocity OD ranch aerial proposals
description: Three exploratory marks and their application-header context; no production icon selected.
colors:
  od-green: "#4b5320"
  orange: "#f2621a"
  paper: "#f3eedf"
  ink: "#26281f"
typography:
  wordmark:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "44px"
    fontWeight: 500
    lineHeight: 0.95
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Segoe UI, Arial, sans-serif"
    fontSize: "14px"
    lineHeight: 1.45
---

## Overview

These are identity proposals for the user-preferred Velocity OD theme. The production app and its icons remain unchanged. Every SVG combines the original ranch-image bytes with new vector framing and arrows. SVG viewports crop out the original blue sky and previous mark; the aerial itself is not regenerated.

## Colors

Ranch Horizon uses a broad aerial below an OD green upper panel and orange arrow/arches. Ranch Emblem uses a circular aerial window, cream ring, and arrow crest. Ranch Frame uses a large aerial window, green frame, and arrow badge. The Velocity header retains the green round panel and orange action.

## Typography

The shared wordmark uses the existing locally licensed Newsreader italic, weight 500. The context wordmark reduces to 32px and to 29px in the intermediate layout. Small descriptive text remains sans serif.

## Layout

Three columns compare an icon and wordmark, actual 48px/32px icon examples, and a static application-header context. The comparison stacks at 820px and below. The 128-unit SVG viewBox is square and has no baked-in corner mask. Exported PNGs are 512px square.

## Elevation & Depth

Large icon previews use an 8px-down, 12px-blur shadow. Smaller icon examples and production-source SVGs are flat. The existing ranch aerial is the required image content; no replacement landscape or gradient is generated.

## Shapes

Preview masks use a 24% corner radius or 50% for circular launcher comparisons. The glyph stays within the square artwork. The prototype masks do not implement Android adaptive layers.

## Components

Mask buttons update all icon previews, with pressed state exposed. The grayscale toggle affects the large and small icon examples while preserving a colored app-context reference. Real SVG/PNG links open each source asset. The app-context preview is static and labels its sample content. No saved application state is accessed.

## Do's and Don'ts

Keep the ranch aerial central and arrow cues clear. Simplification must not remove the ranch. Compare masks and grayscale before choosing a mark. Keep the wordmark tied to Velocity OD. Do not treat a comparison as approval to replace production files.
