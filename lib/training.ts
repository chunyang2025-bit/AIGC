import { TrainingFormat } from "./types";

export const trainingFormatOptions: Array<{ value: TrainingFormat; label: string }> = [
  { value: "online", label: "线上培训" },
  { value: "offline", label: "线下内训" },
  { value: "hybrid", label: "线上+线下" },
  { value: "workshop", label: "工作坊" },
  { value: "bootcamp", label: "训练营" },
  { value: "coaching", label: "长期陪跑" }
];

export const defaultTrainingTopics = [
  "提示词工程",
  "AI办公提效",
  "AI营销内容",
  "AI设计",
  "AI短视频",
  "数字人",
  "AI自动化",
  "AI编程"
];

export function trainingFormatLabel(value?: string) {
  return value ? trainingFormatOptions.find((item) => item.value === value)?.label ?? value : "未填写";
}
