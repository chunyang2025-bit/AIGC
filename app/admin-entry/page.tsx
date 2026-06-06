import Link from "next/link";
import { ArrowRight, ShieldCheck, UserCog } from "lucide-react";

export default function AdminEntryPage() {
  return (
    <main className="main">
      <section className="portalHero">
        <div className="stack">
          <span className="eyebrow">
            <ShieldCheck size={15} /> 运营后台入口
          </span>
          <div>
            <h1>后台审核</h1>
            <p>平台运营人员登录后处理主体主页、服务方主页、培训名师主页、需求发布、举报和试用反馈。</p>
          </div>
          <div className="toolbarGroup">
            <Link className="btn primary" href="/login?role=admin&next=%2Fadmin">
              登录运营后台 <ArrowRight size={16} />
            </Link>
            <Link className="btn" href="/register?role=admin">
              使用邀请码注册后台账号
            </Link>
          </div>
        </div>
        <div className="portalStats">
          <div className="metric">
            <strong>主体</strong>
            <span>派单方主页审核</span>
          </div>
          <div className="metric">
            <strong>服务方</strong>
            <span>创作者/培训名师审核</span>
          </div>
          <div className="metric">
            <strong>需求</strong>
            <span>派单/培训需求审核</span>
          </div>
        </div>
      </section>

      <div className="grid three">
        <section className="card">
          <div className="cardBody stack">
            <ShieldCheck size={22} />
            <strong>派单方主页审核</strong>
            <p className="muted" style={{ margin: 0 }}>企业、机构、个人主体都进入审核队列。试运营期间不阻断使用，审核通过后提升信任并进入更完整展示。</p>
          </div>
        </section>
        <section className="card">
          <div className="cardBody stack">
            <UserCog size={22} />
            <strong>创作者/培训名师审核</strong>
            <p className="muted" style={{ margin: 0 }}>个人创作者也需要审核。个人可不上传营业执照，但需要确认主页内容和联系方式可信。</p>
          </div>
        </section>
        <section className="card">
          <div className="cardBody stack">
            <ShieldCheck size={22} />
            <strong>需求审核</strong>
            <p className="muted" style={{ margin: 0 }}>需求提交后可先试用候选推荐和沟通线索；审核通过后进入公开大厅展示。</p>
          </div>
        </section>
      </div>
    </main>
  );
}
