import React, { useRef, useState, useEffect } from "react";
import { useQRCode } from "../hooks/useQRCode";
import type { FrameId } from "./frames/types";
import type { QREditorState } from "./QREditor";
import { FrameRenderer } from "./frames/FrameRenderer";
import { getFrameLayout } from "./frames/frameLayout";

// Max screen render size
const SCREEN_SIZE = 300;

interface QRPreviewProps {
  state: QREditorState;
  frameId: FrameId;
  frameColor: string;
  frameBgColor: string;
  frameLabelText: string;
  frameLabelColor: string;
  frameFontSize: number;
  isLoading: boolean;
}

export function QRPreview({
  state,
  frameId,
  frameColor,
  frameBgColor,
  frameLabelText,
  frameLabelColor,
  frameFontSize,
  isLoading,
}: QRPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useQRCode(containerRef, state, SCREEN_SIZE);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 400);
    return () => clearTimeout(t);
  }, []);

  const hasFrame = frameId !== "none";
  const layout = getFrameLayout(SCREEN_SIZE);

  return (
    <div className="flex items-center justify-center w-full h-full">
      {/* Loading skeleton */}
      {(!ready || isLoading) && (
        <div
          className="skeleton rounded-sm absolute pointer-events-none"
          style={{ width: SCREEN_SIZE, height: SCREEN_SIZE }}
        />
      )}

      {/* Preview container */}
      <div
        className="relative transition-opacity duration-300"
        style={{
          opacity: ready && !isLoading ? 1 : 0,
          width: hasFrame ? layout.width : SCREEN_SIZE,
          height: hasFrame ? layout.height : SCREEN_SIZE,
          ...(hasFrame && frameBgColor ? { backgroundColor: frameBgColor, borderRadius: 10 } : {}),
        }}
      >
        {/* QR canvas — always the same DOM node so useQRCode never loses its target */}
        <div
          ref={containerRef}
          aria-label={`QR code for: ${state.content || "empty"}`}
          role="img"
          style={
            hasFrame
              ? {
                  position: "absolute",
                  top: layout.qrY,
                  left: layout.qrX,
                  width: layout.qrSize,
                  height: layout.qrSize,
                }
              : {
                  width: SCREEN_SIZE,
                  height: SCREEN_SIZE,
                }
          }
        />

        {/* Frame SVG — rendered on top only when a frame is active */}
        {hasFrame && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: "none",
            }}
          >
            <FrameRenderer
              frameId={frameId}
              width={layout.width}
              height={layout.height}
              qrX={layout.qrX}
              qrY={layout.qrY}
              qrSize={layout.qrSize}
              color={frameColor}
              labelText={frameLabelText}
              labelColor={frameLabelColor}
              fontSize={frameFontSize}
              bgFill={undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
}
