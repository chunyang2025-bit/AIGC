"use client";

import Link from "next/link";
import { CheckCircle2, Clock, Star } from "lucide-react";
import { money, verificationTypeLabel } from "@/lib/format";
import { isImageValue } from "@/lib/file-upload";
import { CreatorProfile } from "@/lib/types";
import { loginNextPath, readAuthSession } from "@/lib/auth";

type CreatorCardProps = {
  creator: CreatorProfile;
  matchScore?: number;
  reason?: string;
  risk?: string;
  nextStep?: string;
  onInvite?: () => void;
};

export function CreatorCard({ creator, matchScore, reason, risk, nextStep, onInvite }: CreatorCardProps) {
  const displayName = creator.displayName ?? creator.name;
  const avatar = creator.avatarUrl || displayName.slice(0, 1);
  const session = readAuthSession();

  return (
    <article className="card">
      <div className="cardMedia" style={{ "--media-bg": creator.cover } as React.CSSProperties}>
        <div>
          <div className="row">
            <span className="avatar">{isImageValue(avatar) ? <img alt={displayName} src={avatar} /> : avatar.slice(0, 1)}</span>
            <div>
              <strong>{displayName}</strong>
              <div>{creator.profileSlogan ?? creator.title}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="cardBody stack">
        <div className="spaceBetween">
          <span className="tag green">{creator.location}</span>
          <span className="tag">{verificationTypeLabel(creator.verificationType ?? creator.identityType)}</span>
          {creator.verified ? (
            <span className="tag blue">
              <CheckCircle2 size={13} /> 已认证
            </span>
          ) : (
            <span className="tag">待审核</span>
          )}
        </div>
        <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
          {creator.bio}
        </p>
        <div className="tagList">
          {creator.skills.slice(0, 4).map((skill) => (
            <span className="tag" key={skill}>
              {skill}
            </span>
          ))}
        </div>
        <div className="spaceBetween">
          <span className="row muted">
            <Star size={16} fill="#a86612" color="#a86612" /> {creator.rating.toFixed(1)}
          </span>
          <span className="row muted">
            <Clock size={16} /> {creator.responseTime}
          </span>
        </div>
        <div className="spaceBetween">
          <strong>
            {money(creator.priceMin)}-{money(creator.priceMax)}
          </strong>
          <span className="muted">已完成{creator.completedProjects}单</span>
        </div>
        <Link className="btn" href={session ? `/creators/${creator.id}` : loginNextPath("buyer", `/creators/${creator.id}`)}>
          {session ? "查看展示页" : "登录后查看展示页"}
        </Link>
        {typeof matchScore === "number" ? (
          <div className="agentInsight">
            <div className="spaceBetween">
              <strong>{matchScore}% 匹配</strong>
              <span className="tag blue">Matching Agent</span>
            </div>
            <p>{reason}</p>
            {risk ? <p><b>风险提示：</b>{risk}</p> : null}
            {nextStep ? <p><b>下一步：</b>{nextStep}</p> : null}
          </div>
        ) : null}
        {onInvite ? (
          <button className="btn primary" onClick={onInvite}>
            邀请沟通
          </button>
        ) : null}
      </div>
    </article>
  );
}
