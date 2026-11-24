import { useEffect, useRef, useState } from "react";
import type { ComposeInput } from "../lib/compose";
import { verifyScan, type ScanStatus } from "../lib/scan";

/** Debounced real decode of the current design. */
export function useScanCheck(
  input: ComposeInput,
  enabled: boolean,
  delay = 450,
): ScanStatus {
  const [status, setStatus] = useState<ScanStatus>("idle");
  const run = useRef(0);
  const key = JSON.stringify([
    input.data,
    input.qr,
    input.frame.id,
    input.frame.paper,
  ]);

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return;
    }
    const id = ++run.current;
    setStatus("checking");
    const t = setTimeout(() => {
      verifyScan(input, input.data)
        .then((s) => id === run.current && setStatus(s))
        .catch(() => id === run.current && setStatus("fail"));
    }, delay);
    return () => clearTimeout(t);
    // `key` captures everything in `input` that affects scannability.
  }, [key, enabled, delay]);

  return status;
}
