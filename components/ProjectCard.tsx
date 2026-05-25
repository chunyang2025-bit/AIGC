"use client";

import Link from "next/link";
import { ArrowRight, Bot, Building2, CalendarDays, WalletCards } from "lucide-react";
import { categoryLabel, compactDate, money, projectStatusLabel } from "@/lib/format";
import { Project } from "@/lib/types";
import { readAuthSession } from "@/lib/auth";

export function ProjectCard({
  project,
  buyerName = "需求发布方",
  publicMode = false
}: {
  project: Project;
  buyerName?: string;
  publicMode?: boolean;
}) {
  const statusClass = project.status === "completed" ? "green" : project.status === "open" ? "blue" : "gold";
  const session = readAuthSession();
  const detailHref = session ? `/projects/${project.id}` : "/login";

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
          </div>
          <span className={`tag ${statusClass}`}>{projectStatusLabel(project.status)}</span>
        </div>
        <div>
          <h3 style={{ margin: "0 0 8px", fontSize: 20 }}>{project.title}</h3>
          <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
            {project.description.split("\n").slice(0, 2).join(" ")}
          </p>
        </div>
        <Link className="row muted" href={session ? `/buyers/${project.buyerId}` : "/login"}>
          <Building2 size={16} /> {buyerName}
        </Link>
        <div className="spaceBetween">
          <span className="row muted">
            <WalletCards size={16} /> {money(project.budget)}
          </span>
          <span className="row muted">
            <CalendarDays size={16} /> {compactDate(project.deadline)}
          </span>
        </div>
        <div className="toolbarGroup">
          <Link className="btn" href={detailHref}>
            {session ? "查看详情" : "登录后查看详情"} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
