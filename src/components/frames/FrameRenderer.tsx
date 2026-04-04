import React from "react";
import { FrameBanner } from "./FrameBanner";
import { FramePolaroid } from "./FramePolaroid";
import { FrameRounded } from "./FrameRounded";
import { FrameSimple } from "./FrameSimple";
import { FrameSpeechBubble } from "./FrameSpeechBubble";
import { FrameTicket } from "./FrameTicket";
import type { FrameRendererProps } from "./types";

const frameComponents = {
  simple: FrameSimple,
  rounded: FrameRounded,
  ticket: FrameTicket,
  "speech-bubble": FrameSpeechBubble,
  banner: FrameBanner,
  polaroid: FramePolaroid,
} as const;

export function FrameRenderer({ frameId, ...props }: FrameRendererProps) {
  const Component = frameComponents[frameId];
  return <Component {...props} />;
}