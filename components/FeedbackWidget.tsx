"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { submitFeedback } from "@/lib/store";
import { TrialFeedback } from "@/lib/types";

const feedbackCategories: Array<{ value: TrialFeedback["category"]; label: string }> = [
  { value: "suggestion", label: "建议" },
  { value: "bug", label: "问题" },
  { value: "confusing", label: "看不懂" },
  { value: "missing_feature", label: "缺功能" },
  { value: "other", label: "其他" }
];

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<TrialFeedback["category"]>("suggestion");
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function submit() {
    const text = content.trim();
    if (text.length < 3) return;
    const result = submitFeedback({
      page: typeof window === "undefined" ? "" : window.location.pathname,
      category,
      rating,
      content: text
    });
    if (result) {
      setSubmitted(true);
      setContent("");
      window.setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
      }, 1200);
    }
  }

  return (
    <div className="feedbackWidget">
      {open ? (
        <div className="feedbackPanel">
          <div className="spaceBetween">
            <strong>试用建议</strong>
            <button className="iconBtn" onClick={() => setOpen(false)} type="button" title="关闭">×</button>
          </div>
          <div className="field">
            <label htmlFor="feedback-category">类型</label>
            <select id="feedback-category" value={category} onChange={(event) => setCategory(event.target.value as TrialFeedback["category"])}>
              {feedbackCategories.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="feedback-rating">体验评分</label>
            <select id="feedback-rating" value={rating} onChange={(event) => setRating(Number(event.target.value))}>
              {[5, 4, 3, 2, 1].map((item) => (
                <option key={item} value={item}>{item}分</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="feedback-content">建议内容</label>
            <textarea
              id="feedback-content"
              placeholder="哪里不顺、哪里看不懂、还想要什么功能"
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
          </div>
          <button className="btn primary" disabled={content.trim().length < 3 || submitted} onClick={submit} type="button">
            {submitted ? "已提交" : "提交建议"}
          </button>
        </div>
      ) : null}
      <button className="feedbackTrigger" onClick={() => setOpen((value) => !value)} type="button">
        <MessageSquare size={16} /> 反馈
      </button>
    </div>
  );
}
