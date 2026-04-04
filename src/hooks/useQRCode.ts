import { useEffect, useRef, useCallback } from "react";
import QRCodeStyling from "qr-code-styling";
import type { QREditorState } from "../components/QREditor";

type QRCodeStylingOptions = ConstructorParameters<typeof QRCodeStyling>[0];

export function useQRCode(
  containerRef: React.RefObject<HTMLDivElement | null>,
  state: QREditorState,
  size: number = 512,
) {
  const qrRef = useRef<QRCodeStyling | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildOptions = useCallback(
    (renderSize: number) => {
      const {
        content,
        dotShape,
        dotGradient,
        cornerSquareShape,
        cornerSquareColor,
        cornerDotShape,
        cornerDotColor,
        bgColor,
        bgTransparent,
        errorCorrection,
        logo,
        logoSize,
        logoMargin,
      } = state;

      const dotsOptions: Record<string, unknown> = {
        type: dotShape,
      };
      if (dotGradient.enabled) {
        dotsOptions.gradient = {
          type: dotGradient.type,
          rotation: 0,
          colorStops: [
            { offset: 0, color: dotGradient.color1 },
            { offset: 1, color: dotGradient.color2 },
          ],
        };
      } else {
        // Use dotGradient.color1 so the solid-color picker (which updates color1)
        // is always reflected even when gradient is disabled.
        dotsOptions.color = dotGradient.color1;
      }

      return {
        width: renderSize,
        height: renderSize,
        data: content || "https://example.com",
        qrOptions: {
          errorCorrectionLevel: errorCorrection as "L" | "M" | "Q" | "H",
        },
        dotsOptions,
        cornersSquareOptions: {
          type: cornerSquareShape,
          color: cornerSquareColor,
        },
        cornersDotOptions: {
          type: cornerDotShape,
          color: cornerDotColor,
        },
        backgroundOptions: bgTransparent
          ? { color: "transparent" }
          : { color: bgColor },
        image: logo || undefined,
        imageOptions: {
          crossOrigin: "anonymous",
          hideBackgroundDots: true,
          margin: logo ? logoMargin : 0,
          imageSize: logo ? logoSize / 100 : 0.4,
        },
      };
    },
    [state],
  );

  // Initial mount
  useEffect(() => {
    if (!containerRef.current) return;
    qrRef.current = new QRCodeStyling(
      buildOptions(size) as QRCodeStylingOptions,
    );
    qrRef.current.append(containerRef.current);
    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, []); // mount-only: intentionally omits dependencies

  // Debounced update
  useEffect(() => {
    if (!qrRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      qrRef.current!.update(
        buildOptions(size) as QRCodeStylingOptions,
      );
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [state, size, buildOptions]);

  const getQR = () => qrRef.current;

  return { getQR };
}
