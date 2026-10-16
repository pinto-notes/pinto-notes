import s from "./lab.module.css";

export function Head() {
  return (
    <header className={s.head}>
      <h1 className={s.h1}>Blog</h1>
      <p className={s.lede}>Straight answers about Apple Notes, and how to get ChatGPT and Claude working with your notes. Every step tried on a real Mac first.</p>
    </header>
  );
}
