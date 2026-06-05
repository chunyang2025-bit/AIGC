"use client";

import Link from "next/link";
import { CheckCircle2, Clock, Star } from "lucide-react";
import { money, verificationTypeLabel } from "@/lib/format";
import { isImageValue } from "@/lib/file-upload";
import { trainingFormatLabel } from "@/lib/training";
import { CreatorProfile } from "@/lib/types";

type CreatorCardProps = {
  creator: CreatorProfile;
  matchScore?: number;
  reason?: string;
  risk?: string;
  nextStep?: string;
  onInvite?: () => void;
  invited?: boolean;
  inviteLabel?: string;
  invitedLabel?: string;
  onToggleCandidate?: () => void;
  candidateSelected?: boolean;
};

export function CreatorCard({ creator, matchScore, reason, risk, nextStep, onInvite, invited, inviteLabel = "邀请沟通", invitedLabel = "已邀请", onToggleCandidate, candidateSelected }: CreatorCardProps) {
  const displayName = creator.displayName ?? creator.name;
  const avatar = creator.avatarUrl || displayName.slice(0, 1);
  const featuredPackage = creator.servicePackages?.[0];

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
        {creator.trainingProfile ? (
          <div className="miniInfo">
            <strong>{creator.trainingProfile.topics.slice(0, 3).join("、") || "AIGC培训"}</strong>
            <span>
              {creator.trainingProfile.formats.slice(0, 2).map(trainingFormatLabel).join("、") || "培训形式待沟通"}
              {creator.trainingProfile.cities.length ? ` · ${creator.trainingProfile.cities.slice(0, 2).join("、")}` : ""}
            </span>
          </div>
        ) : null}
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
        {featuredPackage ? (
          <div className="miniInfo">
            <strong>{featuredPackage.name}</strong>
            <span>
              {money(featuredPackage.price)} · {featuredPackage.deliveryDays || "-"}天交付 · {featuredPackage.revisions}次修改
            </span>
          </div>
        ) : null}
        <Link className="btn" href={`/creators/${creator.id}`}>
          查看展示页
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
        {onInvite || invited ? (
          <button className={invited ? "btn" : "btn primary"} disabled={invited} onClick={onInvite} type="button">
            {invited ? invitedLabel : inviteLabel}
          </button>
        ) : null}
        {onToggleCandidate ? (
          <button className={candidateSelected ? "btn primary" : "btn"} onClick={onToggleCandidate} type="button">
            {candidateSelected ? "已加入候选" : "加入候选"}
          </button>
        ) : null}
      </div>
    </article>
  );
}
