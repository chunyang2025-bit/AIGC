"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { submitReport } from "@/lib/store";
import { AbuseReport } from "@/lib/types";

export function ReportButton({
  targetType,
  targetId
}: {
  targetType: AbuseReport["targetType"];
  targetId: string;
}) {
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function report() {
    if (reason.trim().length < 5) return;
    const result = submitReport({ targetType, targetId, reason });
    if (result) {
      setSubmitted(true);
      setReason("");
    }
  }

  return (
    <div className="reportBox">
      <div className="field">
        <label htmlFor={`report-${targetType}-${targetId}`}>举报原因</label>
        <input
          id={`report-${targetType}-${targetId}`}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="虚假信息、侵权、骚扰或其他违规"
        />
      </div>
      <button className="btn" disabled={reason.trim().length < 5 || submitted} onClick={report} type="button">
        <Flag size={16} /> {submitted ? "已提交" : "提交举报"}
      </button>
    </div>
  );
}
