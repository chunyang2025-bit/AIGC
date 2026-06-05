"use client";

import Link from "next/link";
import { ArrowRight, Bot, Building2, CalendarDays, WalletCards } from "lucide-react";
import { categoryLabel, compactDate, money, projectStatusLabel } from "@/lib/format";
import { trainingFormatLabel } from "@/lib/training";
import { Project } from "@/lib/types";

export function ProjectCard({
  project,
  buyerName = "需求发布方",
  matchScore,
  publicMode = false
}: {
  project: Project;
  buyerName?: string;
  matchScore?: number;
  publicMode?: boolean;
}) {
  const statusClass = project.status === "completed" ? "green" : project.status === "open" ? "blue" : "gold";
  const detailHref = `/projects/${project.id}`;

  return (
    <article className={publicMode ? "projectJobCard" : "card"}>
      <div className="cardBody stack">
        <div className="spaceBetween">
          <div className="tagList">
            <span className="tag blue">{categoryLabel(project.category)}</span>
            {project.agentBrief ? (
              <span className="tag green">
                <Bot size={13} /> Agent已拆解
              </span>
            ) : null}
            {matchScore !== undefined ? <span className="tag blue">{matchScore}% 适合我</span> : null}
          </div>
          <span className={`tag ${statusClass}`}>{projectStatusLabel(project.status)}</span>
        </div>
        <div>
          <h3 style={{ margin: "0 0 8px", fontSize: 20 }}>{project.title}</h3>
          <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
            {project.description.split("\n").slice(0, 2).join(" ")}
          </p>
        </div>
        {project.tags?.length ? (
          <div className="tagList">
            {project.tags.slice(0, 5).map((tag) => (
              <span className="tag" key={tag}>{tag}</span>
            ))}
          </div>
        ) : null}
        {project.trainingRequirement ? (
          <div className="miniInfo">
            <strong>{trainingFormatLabel(project.trainingRequirement.format)} · {project.trainingRequirement.audience || "培训对象待沟通"}</strong>
            <span>
              {project.trainingRequirement.headcount ? `${project.trainingRequirement.headcount}人 · ` : ""}
              {project.trainingRequirement.city || "线上/城市待沟通"} · {project.trainingRequirement.duration || "时长待沟通"}
            </span>
          </div>
        ) : null}
        <Link className="row muted" href={`/buyers/${project.buyerId}`}>
          <Building2 size={16} /> {buyerName}
        </Link>
        <div className="spaceBetween">
          <span className="row muted">
            <WalletCards size={16} /> 意向预算 {money(project.budget)}
          </span>
          <span className="row muted">
            <CalendarDays size={16} /> {compactDate(project.deadline)}
          </span>
        </div>
        <div className="toolbarGroup">
          <Link className="btn" href={detailHref}>
            查看公开详情 <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
