"use client";

import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, CircleDotDashed, MessageSquare, PhoneCall, RotateCcw } from "lucide-react";
import { compactDate, money, orderStatusLabel } from "@/lib/format";
import { loadMarketplaceData, updateOrderStatus } from "@/lib/store";
import { OrderStatus } from "@/lib/types";

const statusActions: Array<{ label: string; status: OrderStatus; icon: React.ReactNode }> = [
  { label: "已发送资料", status: "delivered", icon: <MessageSquare size={16} /> },
  { label: "继续沟通", status: "revision", icon: <RotateCcw size={16} /> },
  { label: "标记已达成意向", status: "approved", icon: <CheckCircle2 size={16} /> }
];

export default function OrderPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const data = loadMarketplaceData();
  const order = data.orders.find((item) => item.id === params.id);

  if (!order) {
    notFound();
  }

  const project = data.projects.find((item) => item.id === order.projectId);
  const creator = data.creators.find((item) => item.id === order.creatorId);
  const messages = data.messages.filter((message) => message.orderId === order.id).reverse();

  return (
    <main className="main">
      <div className="toolbar">
        <Link className="btn" href={project ? `/projects/${project.id}` : "/projects"}>
          <ArrowLeft size={16} /> 返回需求
        </Link>
      </div>

      <div className="split">
        <section className="card">
          <div className="panelTop">
            <div>
              <h1 style={{ margin: 0, fontSize: 26 }}>{project?.title ?? "合作线索"}</h1>
              <div className="muted">意向创作者：{creator?.name ?? "创作者"} · 需求预算 {money(order.amount)}</div>
            </div>
            <span className="tag green">{orderStatusLabel(order.status)}</span>
          </div>
          <div className="chat">
            {messages.map((message) => {
              const sender = data.users.find((user) => user.id === message.senderId);
              const mine = message.senderId === order.buyerId;

              return (
                <div className={`message ${mine ? "mine" : ""}`} key={message.id}>
                  <strong>{sender?.name ?? "User"}</strong>
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
            <input aria-label="message" placeholder="记录沟通备注或下一步安排" style={{ flex: 1, minHeight: 40, border: "1px solid var(--line)", borderRadius: 8, padding: "0 12px" }} />
            <button className="btn primary">
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
                  className={action.status === "approved" ? "btn primary" : "btn"}
                  key={action.status}
                  onClick={() => {
                    updateOrderStatus(order.id, action.status);
                    router.refresh();
                  }}
                >
                  {action.icon} {action.label}
                </button>
              ))}
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
