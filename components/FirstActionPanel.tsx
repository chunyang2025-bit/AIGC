import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleDot } from "lucide-react";

type FirstActionStep = {
  label: string;
  done: boolean;
};

type FirstActionPanelProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  steps: FirstActionStep[];
  secondaryLabel?: string;
  secondaryHref?: string;
};

export function FirstActionPanel({
  eyebrow,
  title,
  description,
  primaryLabel,
  primaryHref,
  steps,
  secondaryLabel,
  secondaryHref
}: FirstActionPanelProps) {
  const completed = steps.filter((step) => step.done).length;

  return (
    <section className="conversionCard">
      <div className="stack">
        <span className="tag green">{eyebrow}</span>
        <div>
          <h2 style={{ margin: "0 0 8px" }}>{title}</h2>
          <p style={{ margin: 0 }}>{description}</p>
        </div>
        <div className="tagList">
          {steps.map((step) => (
            <span className={step.done ? "tag green" : "tag"} key={step.label}>
              {step.done ? <CheckCircle2 size={13} /> : <CircleDot size={13} />} {step.label}
            </span>
          ))}
        </div>
      </div>
      <div className="stack">
        <span className="tag blue">{completed}/{steps.length} 已完成</span>
        <Link className="btn primary" href={primaryHref}>
          {primaryLabel} <ArrowRight size={16} />
        </Link>
        {secondaryHref && secondaryLabel ? (
          <Link className="btn" href={secondaryHref}>
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
