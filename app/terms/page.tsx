export default function TermsPage() {
  return (
    <main className="main">
      <section className="card">
        <div className="cardBody stack">
          <h1 style={{ margin: 0 }}>平台服务协议</h1>
          <p className="muted">本平台提供AIGC内容服务供需信息展示、需求发布、创作者展示、智能匹配和沟通留痕服务。</p>
          <div className="briefBlock">
            <strong>服务范围</strong>
            <p>平台不托管资金，不提供担保交易，不承诺项目成果交付。用户应自行确认合同、付款、交付、验收和售后责任。</p>
          </div>
          <div className="briefBlock">
            <strong>用户责任</strong>
            <p>入驻主体应保证提交的名称、联系方式、资质、需求和作品信息真实、合法、有效，不得发布虚假需求或侵权内容。</p>
          </div>
          <div className="briefBlock">
            <strong>平台审核</strong>
            <p>平台可对主体资料、需求信息和展示内容进行审核、下架、限制曝光或要求补充材料。</p>
          </div>
        </div>
      </section>
    </main>
  );
}
