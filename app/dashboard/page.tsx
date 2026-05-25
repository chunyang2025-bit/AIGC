"use client";

import Link from "next/link";
import { BriefcaseBusiness, Search, UserCog } from "lucide-react";

export default function DashboardPage() {
  return (
    <main className="main">
      <div className="pageHeader">
        <div>
          <h1>按身份进入工作台</h1>
          <p>平台按角色拆分入口：需求发布方发需求，需求接受方表达意向，公开大厅用于浏览派单信息。</p>
        </div>
      </div>

      <div className="grid">
        <Link className="portalChoice" href="/buyer">
          <BriefcaseBusiness size={24} />
          <strong>需求发布方</strong>
          <span>适合机构、品牌、个人或组织发布需求、查看匹配、邀请沟通。</span>
        </Link>
        <Link className="portalChoice" href="/provider">
          <UserCog size={24} />
          <strong>需求接受方</strong>
          <span>适合创作者、工作室和服务商查看需求、表达意向、沉淀沟通线索。</span>
        </Link>
        <Link className="portalChoice" href="/projects">
          <Search size={24} />
          <strong>派单大厅</strong>
          <span>适合浏览公开需求、查看派单方主体信息和可沟通项目。</span>
        </Link>
      </div>
    </main>
  );
}
