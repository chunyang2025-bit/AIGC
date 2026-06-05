import { ProjectCategory } from "./types";

export const projectCategoryOptions: Array<{ value: ProjectCategory; label: string }> = [
  { value: "AI Short Video", label: "AI短视频" },
  { value: "Image Design", label: "图片设计" },
  { value: "Digital Human", label: "数字人口播" },
  { value: "AI Copywriting", label: "AI文案策划" },
  { value: "Ecommerce Content", label: "电商内容包" },
  { value: "Social Media Content", label: "社媒内容运营" },
  { value: "Brand Visual", label: "品牌视觉" },
  { value: "Prompt Engineering", label: "提示词工程" },
  { value: "AI Model Training", label: "AI模型训练" },
  { value: "AI Voice", label: "AI配音/声音" },
  { value: "AI PPT", label: "AI演示/PPT" },
  { value: "AI Course", label: "AI课程内容" },
  { value: "AIGC Training", label: "AIGC培训" }
];

export const projectCategories = projectCategoryOptions.map((item) => item.value);

export function categoryLabel(value: string) {
  return projectCategoryOptions.find((item) => item.value === value)?.label ?? value;
}
