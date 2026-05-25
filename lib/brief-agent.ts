import { AgentBrief, ProjectCategory } from "./types";

type DraftBriefInput = {
  rawIdea: string;
  productName: string;
  audience: string;
  channel: string;
  style: string;
};

export type DraftBriefResult = {
  title: string;
  description: string;
  category: ProjectCategory;
  budget: number;
  deadline: string;
  agentBrief: AgentBrief;
};

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function draftProjectBrief(input: DraftBriefInput): DraftBriefResult {
  const text = `${input.rawIdea} ${input.productName} ${input.channel}`.toLowerCase();
  const category: ProjectCategory = text.includes("数字人") || text.includes("口播")
    ? "Digital Human"
    : text.includes("图") || text.includes("海报") || text.includes("主图")
      ? "Image Design"
      : "AI Short Video";

  const categoryConfig = {
    "AI Short Video": {
      titleSuffix: "AI短视频内容包",
      budget: 3600,
      deliverables: ["15-30秒竖屏成片", "3个开头钩子版本", "中文字幕文件", "封面图1张"],
      criteria: ["前3秒明确呈现核心卖点", "画面比例适配抖音/小红书", "包含产品名称、利益点和行动引导"]
    },
    "Image Design": {
      titleSuffix: "AI商品图/海报套装",
      budget: 2200,
      deliverables: ["主图1张", "场景图4张", "活动横幅1张", "可编辑源文件"],
      criteria: ["主视觉清晰呈现产品", "风格与目标渠道一致", "卖点文字不遮挡主体"]
    },
    "Digital Human": {
      titleSuffix: "数字人口播视频",
      budget: 6800,
      deliverables: ["数字人口播成片", "脚本润色稿", "字幕文件", "封面图1张"],
      criteria: ["口播语气符合品牌调性", "脚本覆盖核心卖点", "字幕准确且画面无明显穿帮"]
    }
  }[category];

  const product = input.productName || "产品/服务";
  const audience = input.audience || "目标客户";
  const channel = input.channel || "抖音、小红书、微信等渠道";
  const style = input.style || "专业、清晰、有转化导向";
  const objective = input.rawIdea || `为${product}制作一组AIGC内容，用于获客和转化。`;

  return {
    title: `${product}${categoryConfig.titleSuffix}`,
    description: [
      `目标：${objective}`,
      `目标用户：${audience}`,
      `投放/发布渠道：${channel}`,
      `风格要求：${style}`,
      `交付物：${categoryConfig.deliverables.join("、")}`,
      `验收标准：${categoryConfig.criteria.join("；")}`
    ].join("\n"),
    category,
    budget: categoryConfig.budget,
    deadline: daysFromNow(category === "Digital Human" ? 10 : 7),
    agentBrief: {
      objective,
      audience,
      style,
      deliverables: categoryConfig.deliverables,
      acceptanceCriteria: categoryConfig.criteria,
      suggestedQuestions: [
        "是否已有产品图片、Logo、品牌色或参考案例？",
        "是否需要创作者提供脚本，还是已有固定文案？",
        "是否需要额外适配多个平台尺寸或多版本测试？"
      ]
    }
  };
}
