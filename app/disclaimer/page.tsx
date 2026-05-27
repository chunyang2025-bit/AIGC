export default function DisclaimerPage() {
  return (
    <main className="main">
      <section className="card">
        <div className="cardBody stack">
          <h1 style={{ margin: 0 }}>免责声明</h1>
          <p className="muted">平台定位为AIGC供需信息撮合和沟通留痕工具，不作为交易相对方。</p>
          <div className="briefBlock">
            <strong>交易责任</strong>
            <p>双方就合同、报价、付款、交付、修改、验收和售后产生的权利义务，由双方自行协商并承担。</p>
          </div>
          <div className="briefBlock">
            <strong>信息真实性</strong>
            <p>平台会进行合理审核，但用户仍需自行判断对方资质、能力、需求真实性和合作风险。</p>
          </div>
          <div className="briefBlock">
            <strong>风险提示</strong>
            <p>建议双方在站外交易前签署书面协议，明确交付范围、付款节点、版权归属和违约责任。</p>
          </div>
        </div>
      </section>
    </main>
  );
}
