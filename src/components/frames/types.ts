import type { ReactNode } from "react";

export type FrameId =
  | "none"
  | "simple"
  | "rounded"
  | "ticket"
  | "speech-bubble"
  | "banner"
  | "polaroid";

export interface FrameLayout {
  width: number;
  height: number;
  qrX: number;
  qrY: number;
  qrSize: number;
}

export interface FrameProps extends FrameLayout {
  color: string;
  labelText: string;
  labelColor: string;
  fontSize: number;
  bgFill?: string;
  children?: ReactNode;
}

export interface FrameRendererProps extends FrameProps {
  frameId: Exclude<FrameId, "none">;
}
