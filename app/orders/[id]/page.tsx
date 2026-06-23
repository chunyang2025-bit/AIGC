"use client";

import { useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, CheckCircle2, CircleDotDashed, MessageSquare, PhoneCall, RotateCcw, UserCheck, XCircle } from "lucide-react";
import { compactDate, money, orderResultReasonLabel, orderStatusLabel } from "@/lib/format";
import { createOrderMessage, loadMarketplaceData, updateOrderStatus } from "@/lib/store";
import { readAuthSession } from "@/lib/auth";
import { CreatorProfile, Message, Order, OrderStatus, Project, User } from "@/lib/types";

const statusActions: Array<{ label: string; status: OrderStatus; icon: React.ReactNode; tone?: "primary" | "danger"; requiresReason?: boolean }> = [
  { label: "已联系", status: "contacted", icon: <UserCheck size={16} /> },
  { label: "已约沟通", status: "meeting_scheduled", icon: <CalendarDays size={16} /> },
  { label: "继续沟通中", status: "revision", icon: <RotateCcw size={16} /> },
  { label: "已达成合作意向", status: "approved", icon: <CheckCircle2 size={16} />, tone: "primary" },
  { label: "对方未回复", status: "no_response", icon: <XCircle size={16} />, tone: "danger", requiresReason: true },
  { label: "暂不合适", status: "not_fit", icon: <XCircle size={16} />, tone: "danger", requiresReason: true },
  { label: "需求变更/取消", status: "cancelled", icon: <XCircle size={16} />, requiresReason: true }
];

const resultReasons = [
  "budget_mismatch",
  "capability_mismatch",
  "schedule_mismatch",
  "unclear_requirement",
  "no_response",
  "solved_elsewhere",
  "requirement_changed",
  "other"
];

export default function OrderPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [session] = useState(() => readAuthSession());
  const [data] = useState(() => loadMarketplaceData());
  const [messageBody, setMessageBody] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>("not_fit");
  const [resultReason, setResultReason] = useState("budget_mismatch");
  const [resultNote, setResultNote] = useState("");
  const [order, setOrder] = useState<Order | null>(() => data.orders.find((item) => item.id === params.id) ?? null);

  if (!order) {
    notFound();
  }

  const [project, setProject] = useState<Project | null>(() => data.projects.find((item) => item.id === order.projectId) ?? null);
  const [creator, setCreator] = useState<CreatorProfile | null>(() => data.creators.find((item) => item.id === order.creatorId) ?? null);
  const [messages, setMessages] = useState<Message[]>(() => data.messages.filter((message) => message.orderId === order.id).reverse());
  const [users, setUsers] = useState<User[]>(() => data.users.filter((user) => user.id === order.buyerId || user.id === creator?.userId || messages.some((message) => message.senderId === user.id)));
  const senderId = session?.role === "creator" ? creator?.userId ?? session.userId : order.buyerId;

  useEffect(() => {
    if (!session?.accessToken) return;

    let active = true;

    fetch(`/api/orders/${params.id}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${session.accessToken}`
      }
    })
      .then((response) => response.json().catch(() => null))
      .then((payload) => {
        if (!active || !payload?.ok || !payload.data) return;
        const next = payload.data as {
          order: Order;
          project: Project | null;
          creator: CreatorProfile | null;
          messages: Message[];
          users: User[];
        };
        setOrder(next.order);
        setProject(next.project);
        setCreator(next.creator);
        setMessages(next.messages.slice().reverse());
        setUsers(next.users);
      })
      .catch(() => null);

    return () => {
      active = false;
    };
  }, [params.id, session?.accessToken]);

  return (
    <main className="main">
      <div className="toolbar">
        <Link className="btn" href={session?.role === "buyer" && project ? `/buyer/projects/${project.id}` : project ? `/projects/${project.id}` : "/projects"}>
          <ArrowLeft size={16} /> 返回需求
        </Link>
      </div>

      <div className="split">
        <section className="card">
          <div className="panelTop">
            <div>
              <h1 style={{ margin: 0, fontSize: 26 }}>{project?.title ?? "合作线索"}</h1>
              <div className="muted">意向创作者：{creator?.name ?? "创作者"} · 意向预算 {money(order.amount)}</div>
            </div>
            <span className="tag green">{orderStatusLabel(order.status)}</span>
          </div>
          <div className="chat">
            {messages.map((message) => {
              const sender = users.find((user) => user.id === message.senderId) ?? data.users.find((user) => user.id === message.senderId);
              const mine = message.senderId === order.buyerId;

              return (
                <div className={`message ${mine ? "mine" : ""}`} key={message.id}>
                  <strong>{sender?.name ?? "用户"}</strong>
                  <div style={{ marginTop: 6, lineHeight: 1.45 }}>{message.body}</div>
                  {message.attachmentUrl ? (
                    <a style={{ display: "block", marginTop: 8, textDecoration: "underline" }} href={message.attachmentUrl}>
                      附件
                    </a>
                  ) : null}
                </div>
              );
            })}
            {messages.length === 0 ? (
              <div className="notice">
                <MessageSquare size={15} /> 邀请沟通后的线索记录会显示在这里。
              </div>
            ) : null}
          </div>
          <div className="panelTop">
            <input
              aria-label="message"
              placeholder="记录沟通备注或下一步安排"
              style={{ flex: 1, minHeight: 40, border: "1px solid var(--line)", borderRadius: 8, padding: "0 12px" }}
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
            />
            <button
              className="btn primary"
              onClick={() => {
                if (!messageBody.trim()) return;
                createOrderMessage(order.id, {
                  senderId,
                  body: messageBody.trim()
                });
                setMessages((current) => [
                  ...current,
                  {
                    id: `tmp-${Date.now()}`,
                    orderId: order.id,
                    senderId,
                    body: messageBody.trim(),
                    createdAt: new Date().toISOString()
                  }
                ]);
                setMessageBody("");
              }}
              type="button"
            >
              <MessageSquare size={16} /> 记录
            </button>
          </div>
        </section>

        <aside className="stack">
          <div className="card">
            <div className="cardBody stack">
              <h2 style={{ margin: 0, fontSize: 22 }}>线索状态</h2>
              <div className="notice">
                平台只记录双方沟通意向，不处理收款、担保交易、成果交付或纠纷。
              </div>
              {statusActions.map((action) => (
                <button
                  className={action.tone === "primary" ? "btn primary" : action.tone === "danger" ? "btn danger" : "btn"}
                  key={action.status}
                  onClick={() => {
                    if (action.requiresReason) {
                      setSelectedStatus(action.status);
                      return;
                    }
                    updateOrderStatus(order.id, action.status);
                    setOrder((current) => current ? { ...current, status: action.status } : current);
                  }}
                >
                  {action.icon} {action.label}
                </button>
              ))}
              <div className="notice stack">
                <strong>关闭/失败原因</strong>
                <div className="field">
                  <label htmlFor="lead-result-status">结果</label>
                  <select id="lead-result-status" value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as OrderStatus)}>
                    <option value="not_fit">暂不合适</option>
                    <option value="no_response">对方未回复</option>
                    <option value="cancelled">需求变更/取消</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="lead-result-reason">原因</label>
                  <select id="lead-result-reason" value={resultReason} onChange={(event) => setResultReason(event.target.value)}>
                    {resultReasons.map((reason) => (
                      <option key={reason} value={reason}>{orderResultReasonLabel(reason)}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="lead-result-note">补充说明</label>
                  <textarea id="lead-result-note" value={resultNote} onChange={(event) => setResultNote(event.target.value)} placeholder="可选，记录价格、时间、能力或其他沟通情况" />
                </div>
                <button
                  className="btn danger"
                  onClick={() => {
                    updateOrderStatus(order.id, selectedStatus, { resultReason, resultNote });
                    setOrder((current) => current ? {
                      ...current,
                      status: selectedStatus,
                      resultReason,
                      resultNote,
                      resultUpdatedAt: new Date().toISOString()
                    } : current);
                  }}
                  type="button"
                >
                  <XCircle size={16} /> 标记结果并保存原因
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="cardBody stack">
              <h2 style={{ margin: 0, fontSize: 22 }}>线索记录</h2>
              <div className="row">
                <CircleDotDashed size={16} />
                <span>创建于 {compactDate(order.createdAt)}</span>
              </div>
              <div className="row">
                <CircleDotDashed size={16} />
                <span>当前状态 {orderStatusLabel(order.status)}</span>
              </div>
              {order.resultReason || order.resultNote ? (
                <div className="notice stack">
                  <strong>结果回收</strong>
                  <span>原因：{orderResultReasonLabel(order.resultReason)}</span>
                  {order.resultNote ? <span>备注：{order.resultNote}</span> : null}
                  {order.resultUpdatedAt ? <span>更新于 {compactDate(order.resultUpdatedAt)}</span> : null}
                </div>
              ) : null}
              {order.deliverableUrl ? (
                <a className="btn" href={order.deliverableUrl}>
                  <PhoneCall size={16} /> 查看沟通资料
                </a>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
