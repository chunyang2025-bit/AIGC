"use client";

import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";

export default function BuyerProfileRedirectPage() {
  return (
    <main className="main">
      <section className="card">
        <div className="cardBody stack">
          <span className="eyebrow">
            <Building2 size={15} /> 主体主页已统一
          </span>
          <div>
            <h1 style={{ margin: 0 }}>派单资料已并入主体主页</h1>
            <p className="muted">同一个主体只需要维护一份主页和资质。完成主体主页后，会按当前业务路径继续。</p>
          </div>
          <div className="toolbarGroup">
            <Link className="btn primary" href="/account/profile">
              去完善主体主页 <ArrowRight size={16} />
            </Link>
            <Link className="btn" href="/account/capabilities">
              继续当前业务
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
