import { categoryLabel as projectCategoryLabel } from "./project-categories";

export function money(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0
  }).format(value);
}

export function compactDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function categoryLabel(value: string) {
  return projectCategoryLabel(value);
}

export function projectStatusLabel(value: string) {
  const labels: Record<string, string> = {
    pending_review: "历史待审核",
    rejected: "已驳回",
    open: "开放中",
    matching: "匹配中",
    in_progress: "进行中",
    completed: "已完成",
    removed: "已下架"
  };
  return labels[value] ?? value;
}

export function orderStatusLabel(value: string) {
  const labels: Record<string, string> = {
    active: "已发起沟通",
    contacted: "已联系",
    meeting_scheduled: "已约沟通",
    delivered: "已交换资料",
    revision: "继续沟通中",
    approved: "已线下合作",
    not_fit: "暂不合适",
    no_response: "对方未回复",
    cancelled: "需求取消"
  };
  return labels[value] ?? value;
}

export function orderResultReasonLabel(value?: string) {
  const labels: Record<string, string> = {
    budget_mismatch: "预算不匹配",
    capability_mismatch: "能力不匹配",
    schedule_mismatch: "时间不匹配",
    unclear_requirement: "需求不清楚",
    no_response: "对方未回复",
    solved_elsewhere: "已通过其他渠道解决",
    requirement_changed: "需求变更/取消",
    other: "其他"
  };
  return value ? labels[value] ?? value : "未填写";
}

export function roleLabel(value: string) {
  const labels: Record<string, string> = {
    buyer: "需求方",
    creator: "创作者",
    admin: "管理员"
  };
  return labels[value] ?? value;
}

export function verificationTypeLabel(value?: string) {
  const labels: Record<string, string> = {
    enterprise: "企业",
    individual_business: "个体工商户",
    individual: "个人",
    government: "政府组织",
    public_institution: "事业单位",
    social_organization: "社会组织",
    school: "学校/教育机构",
    media: "媒体机构",
    brand_owner: "品牌方",
    other: "其他主体"
  };
  return value ? labels[value] ?? value : "未选择";
}

export function requiredCredentialLabel(value?: string) {
  const labels: Record<string, string> = {
    enterprise: "营业执照",
    individual_business: "个体工商户营业执照",
    individual: "个人实名信息",
    government: "统一社会信用代码证书/机关证明",
    public_institution: "事业单位法人证书",
    social_organization: "社会团体法人登记证书",
    school: "办学许可证/学校主体证明",
    media: "媒体资质/ICP备案/出版许可",
    brand_owner: "商标注册证/品牌授权书",
    other: "有效主体资质"
  };
  return value ? labels[value] ?? "有效主体资质" : "有效主体资质";
}

export function credentialUploadOptional(value?: string) {
  return value === "individual";
}

export function credentialRequirementHint(value?: string) {
  if (value === "individual") {
    return "个人主体默认不要求上传身份证照片，可通过手机号、邮箱、公开作品页或平台账号辅助审核。原始实名信息仅用于后台核验，不对外展示。";
  }

  return "原始证明材料仅供平台运营后台审核，公开主页只展示认证类型和认证状态，不展示证照原件或完整证件号码。";
}

export function publicCredentialSummary(value?: string, verified?: boolean) {
  const type = verificationTypeLabel(value);
  return verified ? `${type}已完成平台核验` : `${type}资质待平台审核`;
}

export function activityEventLabel(value: string) {
  const labels: Record<string, string> = {
    login: "登录",
    browse: "浏览",
    submit_review: "提交认证审核",
    post_project: "发布需求",
    invite_creator: "邀请创作者",
    send_message: "发送消息",
    deliver_order: "发送资料",
    approve_order: "达成意向",
    review_subject: "主体审核",
    review_project: "需求审核",
    remove_project: "需求下架",
    report_abuse: "提交举报",
    submit_feedback: "提交试用建议",
    resolve_feedback: "处理试用建议",
    resolve_report: "处理举报",
    suspend_user: "封禁用户"
  };
  return labels[value] ?? value;
}

export function targetTypeLabel(value?: string) {
  const labels: Record<string, string> = {
    creator: "创作者",
    buyer_profile: "需求方主页",
    project: "需求",
    order: "合作线索",
    message: "消息",
    user: "用户",
    report: "举报",
    feedback: "试用建议"
  };
  return value ? labels[value] ?? value : "-";
}
