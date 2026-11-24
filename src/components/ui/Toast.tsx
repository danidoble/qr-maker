import { AnimatePresence, motion } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { IconName } from "../../lib/icons";
import { Icon } from "./Icon";

type Tone = "success" | "error" | "info";
interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
}

const Ctx = createContext<(message: string, tone?: Tone) => void>(() => {});

export const useToast = () => useContext(Ctx);

const ICON: Record<Tone, IconName> = {
  success: "check",
  error: "alert",
  info: "info",
};
const COLOR: Record<Tone, string> = {
  success: "text-success",
  error: "text-danger",
  info: "text-accent",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const push = useCallback((message: string, tone: Tone = "success") => {
    const id = ++seq.current;
    setItems((xs) => [...xs.slice(-2), { id, message, tone }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 2800);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+88px)] lg:bottom-auto lg:top-[72px] z-[100] flex flex-col items-center gap-2 px-4"
      >
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                y: 8,
                scale: 0.95,
                transition: { duration: 0.15 },
              }}
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
              className="pointer-events-auto flex items-center gap-2.5 rounded-2xl border border-line-strong bg-surface/90 backdrop-blur-xl px-4 py-2.5 text-[14px] text-fg shadow-card"
            >
              <span className={COLOR[t.tone]}>
                <Icon name={ICON[t.tone]} size={16} stroke={2.2} />
              </span>
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
