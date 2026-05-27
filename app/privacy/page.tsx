export default function PrivacyPage() {
  return (
    <main className="main">
      <section className="card">
        <div className="cardBody stack">
          <h1 style={{ margin: 0 }}>隐私政策</h1>
          <p className="muted">平台仅为入驻、审核、展示、匹配和沟通留痕目的收集必要信息。</p>
          <div className="briefBlock">
            <strong>收集信息</strong>
            <p>包括账号信息、主体资料、联系方式、资质文件名、需求信息、展示页内容、浏览与沟通记录。</p>
          </div>
          <div className="briefBlock">
            <strong>使用方式</strong>
            <p>用于账号识别、主体审核、公开展示、智能匹配、运营统计和安全风控。月活与运营数据仅平台运营方可见。</p>
          </div>
          <div className="briefBlock">
            <strong>用户控制</strong>
            <p>用户可修改展示资料和联系方式；涉及公开展示的信息请确保已获得必要授权。</p>
          </div>
        </div>
      </section>
    </main>
  );
}
