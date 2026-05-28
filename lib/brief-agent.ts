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
  const category: ProjectCategory = text.includes("提示词") || text.includes("prompt")
    ? "Prompt Engineering"
    : text.includes("ppt") || text.includes("演示") || text.includes("路演")
      ? "AI PPT"
      : text.includes("课程") || text.includes("培训")
        ? "AI Course"
        : text.includes("配音") || text.includes("声音") || text.includes("音频")
          ? "AI Voice"
          : text.includes("模型") || text.includes("训练") || text.includes("微调")
            ? "AI Model Training"
            : text.includes("文案") || text.includes("脚本") || text.includes("小红书文")
              ? "AI Copywriting"
              : text.includes("电商") || text.includes("详情页") || text.includes("商品")
                ? "Ecommerce Content"
                : text.includes("社媒") || text.includes("运营") || text.includes("矩阵")
                  ? "Social Media Content"
                  : text.includes("品牌") || text.includes("视觉")
                    ? "Brand Visual"
                    : text.includes("数字人") || text.includes("口播")
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
    },
    "AI Copywriting": {
      titleSuffix: "AI文案策划",
      budget: 1800,
      deliverables: ["传播主题", "脚本/文案初稿", "标题备选", "修改建议"],
      criteria: ["卖点表达清晰", "语气符合目标渠道", "可直接进入设计或视频制作"]
    },
    "Ecommerce Content": {
      titleSuffix: "电商内容包",
      budget: 4200,
      deliverables: ["商品主图", "卖点文案", "短视频脚本", "详情页结构"],
      criteria: ["覆盖核心卖点", "适配电商平台展示", "素材命名清晰"]
    },
    "Social Media Content": {
      titleSuffix: "社媒内容运营包",
      budget: 5200,
      deliverables: ["内容选题", "发布文案", "视觉/视频建议", "排期表"],
      criteria: ["符合平台调性", "可连续发布", "包含互动引导"]
    },
    "Brand Visual": {
      titleSuffix: "品牌视觉方案",
      budget: 7800,
      deliverables: ["视觉方向", "主视觉图", "延展模板", "使用说明"],
      criteria: ["品牌识别稳定", "可延展到多渠道", "视觉规范清晰"]
    },
    "Prompt Engineering": {
      titleSuffix: "提示词系统",
      budget: 3000,
      deliverables: ["提示词模板", "变量说明", "示例输出", "优化建议"],
      criteria: ["输出稳定", "变量清晰", "便于团队复用"]
    },
    "AI Model Training": {
      titleSuffix: "AI模型训练需求",
      budget: 12000,
      deliverables: ["数据需求清单", "训练方案", "测试样例", "交付说明"],
      criteria: ["数据边界明确", "效果指标可验收", "风险说明完整"]
    },
    "AI Voice": {
      titleSuffix: "AI配音/声音内容",
      budget: 2600,
      deliverables: ["配音成品", "音色说明", "字幕/文稿", "修改版本"],
      criteria: ["音色适配品牌", "发音清晰", "节奏符合使用场景"]
    },
    "AI PPT": {
      titleSuffix: "AI演示/PPT",
      budget: 3600,
      deliverables: ["PPT成稿", "大纲结构", "视觉模板", "演讲备注"],
      criteria: ["结构清晰", "视觉统一", "重点信息突出"]
    },
    "AI Course": {
      titleSuffix: "AI课程内容",
      budget: 8600,
      deliverables: ["课程大纲", "课件内容", "脚本", "练习/作业设计"],
      criteria: ["知识结构完整", "案例贴合目标用户", "可直接用于录制或授课"]
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
