import { useLabel, type Template } from "@/lib/templates";
import s from "./templates.module.css";

/// The template's button words. When a Mac and an iPhone visitor would see different words, both are
/// in the page and templates.module.css shows the one for html[data-platform] (set before first paint).
export default function UseLabel({ t }: { t: Pick<Template, "slug" | "app"> }) {
  const desktop = useLabel(t, "desktop"), ios = useLabel(t, "ios");
  if (desktop === ios) return <>{desktop}</>;
  return <><span className={s.labelDesktop}>{desktop}</span><span className={s.labelIos}>{ios}</span></>;
}
