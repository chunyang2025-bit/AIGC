import { ShieldCheck } from "lucide-react";

export function BetaNotice() {
  return (
    <section className="notice betaNotice">
      <ShieldCheck size={16} />
      <span>试运营阶段：免费入驻、免费发布需求。平台仅提供信息展示、智能匹配和沟通留痕，不托管资金，不参与合同、收款、交付和售后纠纷。</span>
    </section>
  );
}
