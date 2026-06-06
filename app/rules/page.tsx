export default function RulesPage() {
  return (
    <main className="main">
      <section className="card">
        <div className="cardBody stack">
          <h1 style={{ margin: 0 }}>入驻与信息发布规则</h1>
          <p className="muted">为保证派单需求真实、接单信息可信，平台对入驻主体和公开内容实行基础审核。</p>
          <div className="briefBlock">
            <strong>派单方规则</strong>
            <p>派单方需提交主体名称、联系方式和有效资质。审核通过后方可正式发布需求和邀请接单方沟通。</p>
          </div>
          <div className="briefBlock">
            <strong>接单方规则</strong>
            <p>接单方可先基础入驻并浏览公开需求；通过审核后可主动向派单方发起沟通并发送展示页。</p>
          </div>
          <div className="briefBlock">
            <strong>个人主体审核</strong>
            <p>个人主体、个人创作者和个人培训讲师也需要平台审核。个人证照材料可选，但主页内容、联系方式、作品页或实名备注需要真实可信。</p>
          </div>
          <div className="briefBlock">
            <strong>禁止内容</strong>
            <p>禁止虚假需求、虚假案例、侵权素材、违法广告、冒用资质、诱导站外欺诈和其他违反法律法规的信息。</p>
          </div>
        </div>
      </section>
    </main>
  );
}
