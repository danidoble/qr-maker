import { useCallback } from "react";
import QRCodeStyling from "qr-code-styling";
import type { QREditorState } from "../components/QREditor";
import type { FrameId } from "../components/frames/types";
import { getFrameLayout } from "../components/frames/frameLayout";
import { renderFrameSVG } from "../components/frames/renderFrameSVG";

export type DownloadFormat = "svg" | "png" | "webp";

interface UseDownloadOptions {
  state: QREditorState;
  exportSize: number;
  frameId: FrameId;
  frameColor: string;
  frameBgColor: string;
  frameLabelText: string;
  frameLabelColor: string;
  frameFontSize: number;
  onToast: (msg: string) => void;
}

type QRCodeStylingOptions = ConstructorParameters<typeof QRCodeStyling>[0];

function buildQROptions(state: QREditorState, size: number) {
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

  const dotsOptions: Record<string, unknown> = { type: dotShape };
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
    dotsOptions.color = dotGradient.color1;
  }

  return {
    width: size,
    height: size,
    data: content || "https://example.com",
    qrOptions: {
      errorCorrectionLevel: errorCorrection as "L" | "M" | "Q" | "H",
    },
    dotsOptions,
    cornersSquareOptions: { type: cornerSquareShape, color: cornerSquareColor },
    cornersDotOptions: { type: cornerDotShape, color: cornerDotColor },
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
}

async function qrToCanvas(
  state: QREditorState,
  size: number,
): Promise<HTMLCanvasElement> {
  const qr = new QRCodeStyling(
    buildQROptions(state, size) as QRCodeStylingOptions,
  );
  const blob = await qr.getRawData("png");
  if (!blob) throw new Error("Failed to get QR data");
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function svgStringToImage(
  svgString: string,
  width: number,
  height: number,
): Promise<HTMLImageElement> {
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image(width, height);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function useDownload({
  state,
  exportSize,
  frameId,
  frameColor,
  frameBgColor,
  frameLabelText,
  frameLabelColor,
  frameFontSize,
  onToast,
}: UseDownloadOptions) {
  const downloadSVG = useCallback(async () => {
    const qr = new QRCodeStyling(
      buildQROptions(state, exportSize) as QRCodeStylingOptions,
    );
    await qr.download({ name: "qr-maker", extension: "svg" });
    onToast("QR downloaded as SVG ✓");
  }, [state, exportSize, onToast]);

  const downloadCanvas = useCallback(
    async (format: "png" | "webp") => {
      const mimeType = format === "webp" ? "image/webp" : "image/png";
      const ext = format;

      if (frameId === "none") {
        // Direct from qr-code-styling
        const qr = new QRCodeStyling(
          buildQROptions(state, exportSize) as QRCodeStylingOptions,
        );
        await qr.download({ name: "qr-maker", extension: "png" });
        if (format === "webp") {
          // For webp, we need to go via canvas
          const blob = await qr.getRawData("png");
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const img = await new Promise<HTMLImageElement>((res, rej) => {
            const i = new Image();
            i.onload = () => {
              URL.revokeObjectURL(url);
              res(i);
            };
            i.onerror = rej;
            i.src = url;
          });
          const canvas = document.createElement("canvas");
          canvas.width = exportSize;
          canvas.height = exportSize;
          canvas.getContext("2d")!.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob2) => {
              if (!blob2) return;
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob2);
              a.download = `qr-maker.${ext}`;
              a.click();
              URL.revokeObjectURL(a.href);
            },
            mimeType,
            0.95,
          );
        }
        onToast(`QR downloaded as ${format.toUpperCase()} ✓`);
        return;
      }

      // With frame: compose the same React frame component used in preview.
      const layout = getFrameLayout(exportSize);
      const svgString = renderFrameSVG({
        frameId,
        width: layout.width,
        height: layout.height,
        qrX: layout.qrX,
        qrY: layout.qrY,
        qrSize: layout.qrSize,
        color: frameColor,
        labelText: frameLabelText,
        labelColor: frameLabelColor,
        fontSize: Math.round(frameFontSize * (exportSize / 300)),
        bgFill: frameBgColor,
      });

      const [frameImg, qrCanvas] = await Promise.all([
        svgStringToImage(svgString, layout.width, layout.height),
        qrToCanvas(state, exportSize),
      ]);

      const canvas = document.createElement("canvas");
      canvas.width = layout.width;
      canvas.height = layout.height;
      const ctx = canvas.getContext("2d")!;

      ctx.drawImage(frameImg, 0, 0, layout.width, layout.height);
      ctx.drawImage(
        qrCanvas,
        layout.qrX,
        layout.qrY,
        exportSize,
        exportSize,
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `qr-maker.${ext}`;
          a.click();
          URL.revokeObjectURL(a.href);
          onToast(`QR downloaded as ${format.toUpperCase()} ✓`);
        },
        mimeType,
        0.95,
      );
    },
    [
      state,
      exportSize,
      frameId,
      frameColor,
      frameBgColor,
      frameLabelText,
      frameLabelColor,
      frameFontSize,
      onToast,
    ],
  );

  return { downloadSVG, downloadCanvas };
}
