"use client";

import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

type ShortcutItem = {
  title: string;
  href: string;
  text: string;
  icon: LucideIcon;
};

type ShortcutGridProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  items: ShortcutItem[];
};

export function ShortcutGrid({ eyebrow, title, description, items }: ShortcutGridProps) {
  return (
    <section className="section">
      <div className="sectionHeader">
        <div>
          {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
      </div>
      <div className="grid four">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link className="toolMiniCard" href={item.href} key={item.title}>
              <div className="spaceBetween">
                <Icon size={18} />
                <ArrowRight size={16} />
              </div>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
