import { DeliverableType, ProjectUrgency, ProjectUseCase } from "./types";

export const projectUseCaseOptions: Array<{ value: ProjectUseCase; label: string }> = [
  { value: "marketing", label: "营销投放" },
  { value: "ecommerce", label: "电商上新" },
  { value: "training", label: "培训/课程" },
  { value: "brand", label: "品牌宣传" },
  { value: "internal_efficiency", label: "内部提效" },
  { value: "product_launch", label: "新品首发" },
  { value: "other", label: "其他用途" }
];

export const deliverableTypeOptions: Array<{ value: DeliverableType; label: string }> = [
  { value: "image", label: "图片/海报" },
  { value: "video", label: "短视频" },
  { value: "copywriting", label: "文案/脚本" },
  { value: "digital_human", label: "数字人" },
  { value: "workflow", label: "工作流/自动化" },
  { value: "model", label: "模型/训练" },
  { value: "voice", label: "配音/声音" },
  { value: "ppt", label: "PPT/课件" },
  { value: "other", label: "其他交付物" }
];

export const urgencyOptions: Array<{ value: ProjectUrgency; label: string }> = [
  { value: "normal", label: "常规排期" },
  { value: "this_week", label: "本周内沟通" },
  { value: "urgent", label: "急单" }
];

function labelFrom<T extends string>(options: Array<{ value: T; label: string }>, value?: string) {
  return value ? options.find((item) => item.value === value)?.label ?? value : "未填写";
}

export function projectUseCaseLabel(value?: string) {
  return labelFrom(projectUseCaseOptions, value);
}

export function deliverableTypeLabel(value?: string) {
  return labelFrom(deliverableTypeOptions, value);
}

export function urgencyLabel(value?: string) {
  return labelFrom(urgencyOptions, value);
}
