export type UserRole = "buyer" | "creator" | "admin";

export type ProjectCategory =
  | "AI Short Video"
  | "Image Design"
  | "Digital Human"
  | "AI Copywriting"
  | "Ecommerce Content"
  | "Social Media Content"
  | "Brand Visual"
  | "Prompt Engineering"
  | "AI Model Training"
  | "AI Voice"
  | "AI PPT"
  | "AI Course"
  | "AIGC Training";

export type ProjectStatus = "pending_review" | "rejected" | "open" | "matching" | "in_progress" | "completed" | "removed";

export type OrderStatus = "active" | "contacted" | "meeting_scheduled" | "delivered" | "revision" | "approved" | "not_fit" | "no_response" | "cancelled";

export type VerificationType =
  | "enterprise"
  | "individual_business"
  | "individual"
  | "government"
  | "public_institution"
  | "social_organization"
  | "school"
  | "media"
  | "brand_owner"
  | "other";

export type ProjectUseCase = "marketing" | "ecommerce" | "training" | "brand" | "internal_efficiency" | "product_launch" | "other";

export type DeliverableType = "image" | "video" | "copywriting" | "digital_human" | "workflow" | "model" | "voice" | "ppt" | "other";

export type ProjectUrgency = "normal" | "this_week" | "urgent";

export type TrainingFormat = "online" | "offline" | "hybrid" | "workshop" | "bootcamp" | "coaching";

export type TrainingProfile = {
  topics: string[];
  formats: TrainingFormat[];
  audience: string[];
  cities: string[];
  caseStudies: string[];
  materials: string[];
  pricingNote?: string;
  customizable: boolean;
};

export type TrainingRequirement = {
  topics: string[];
  audience: string;
  headcount?: number;
  format: TrainingFormat;
  city?: string;
  duration?: string;
  goal: string;
  needCustomCases: boolean;
  needMaterials: boolean;
};

export type User = {
  id: string;
  name: string;
  account?: string;
  phone?: string;
  password?: string;
  email: string;
  role: UserRole;
  status?: "active" | "suspended";
  suspendedReason?: string;
  createdAt: string;
};

export type CreatorProfile = {
  id: string;
  userId: string;
  name: string;
  title: string;
  location: string;
  bio: string;
  resume: string;
  skills: string[];
  categories: ProjectCategory[];
  portfolio: string[];
  portfolioItems?: PortfolioItem[];
  servicePackages?: ServicePackage[];
  priceMin: number;
  priceMax: number;
  completedProjects: number;
  rating: number;
  responseTime: string;
  verified: boolean;
  rejectedReason?: string;
  identityType?: VerificationType;
  verificationType?: VerificationType;
  credentialFile?: string;
  qualificationFiles?: string[];
  avatarUrl?: string;
  displayName?: string;
  profileSlogan?: string;
  websiteUrl?: string;
  socialUrl?: string;
  serviceArea?: string;
  contactEmail?: string;
  contactPhone?: string;
  trainingProfile?: TrainingProfile;
  cover: string;
};

export type PortfolioItem = {
  id: string;
  title: string;
  category: ProjectCategory;
  description: string;
  url?: string;
  coverUrl?: string;
  public: boolean;
};

export type ServicePackage = {
  id: string;
  name: string;
  price: number;
  deliveryDays: number;
  revisions: number;
  deliverables: string[];
  description: string;
};

export type BuyerProfile = {
  id: string;
  userId: string;
  companyName: string;
  displayName?: string;
  avatarUrl?: string;
  profileSlogan?: string;
  industry: string;
  location: string;
  companyIntro: string;
  verificationType?: VerificationType;
  contactEmail: string;
  contactPhone: string;
  websiteUrl?: string;
  socialUrl?: string;
  serviceArea?: string;
  businessLicenseFile: string;
  qualificationFiles: string[];
  verified: boolean;
  rejectedReason?: string;
  cover: string;
};

export type Project = {
  id: string;
  buyerId: string;
  title: string;
  description: string;
  category: ProjectCategory;
  tags?: string[];
  useCase?: ProjectUseCase;
  deliverableTypes?: DeliverableType[];
  urgency?: ProjectUrgency;
  needInvoice?: boolean;
  longTerm?: boolean;
  acceptPlatformRecommend?: boolean;
  trainingRequirement?: TrainingRequirement;
  budget: number;
  deadline: string;
  status: ProjectStatus;
  referenceFile?: string;
  qualificationFile?: string;
  contactEmail?: string;
  contactPhone?: string;
  agentBrief?: AgentBrief;
  rejectedReason?: string;
  createdAt: string;
};

export type ProjectMatch = {
  id: string;
  projectId: string;
  creatorId: string;
  score: number;
  reason: string;
  risk?: string;
  nextStep?: string;
};

export type AgentBrief = {
  objective: string;
  audience: string;
  style: string;
  deliverables: string[];
  acceptanceCriteria: string[];
  suggestedQuestions: string[];
};

export type Order = {
  id: string;
  projectId: string;
  buyerId: string;
  creatorId: string;
  amount: number;
  status: OrderStatus;
  resultReason?: string;
  resultNote?: string;
  resultUpdatedAt?: string;
  deliverableUrl?: string;
  createdAt: string;
};

export type Message = {
  id: string;
  orderId: string;
  senderId: string;
  body: string;
  attachmentUrl?: string;
  createdAt: string;
};

export type Review = {
  id: string;
  orderId: string;
  buyerId: string;
  creatorId: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type AbuseReport = {
  id: string;
  reporterId: string;
  targetType: "project" | "creator" | "buyer_profile" | "order" | "message";
  targetId: string;
  reason: string;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  resolution?: string;
  createdAt: string;
};

export type TrialFeedback = {
  id: string;
  userId?: string;
  role?: UserRole;
  page: string;
  rating?: number;
  category: "suggestion" | "bug" | "confusing" | "missing_feature" | "other";
  content: string;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  resolution?: string;
  createdAt: string;
};

export type ActivityEvent = {
  id: string;
  userId: string;
  role: UserRole;
  eventType:
    | "login"
    | "browse"
    | "post_project"
    | "invite_creator"
    | "send_message"
    | "deliver_order"
    | "approve_order"
    | "review_subject"
    | "review_project"
    | "remove_project"
    | "report_abuse"
    | "submit_feedback"
    | "resolve_feedback"
    | "resolve_report"
    | "suspend_user";
  targetType?: "creator" | "buyer_profile" | "project" | "order" | "message" | "user" | "report" | "feedback";
  targetId?: string;
  note?: string;
  createdAt: string;
};

export type MarketplaceData = {
  users: User[];
  buyerProfiles?: BuyerProfile[];
  creators: CreatorProfile[];
  projects: Project[];
  matches: ProjectMatch[];
  orders: Order[];
  messages: Message[];
  reviews: Review[];
  reports: AbuseReport[];
  feedback: TrialFeedback[];
  activityEvents: ActivityEvent[];
};
