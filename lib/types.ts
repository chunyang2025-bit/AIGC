export type UserRole = "buyer" | "creator" | "admin";

export type ProjectCategory = "AI Short Video" | "Image Design" | "Digital Human";

export type ProjectStatus = "open" | "matching" | "in_progress" | "completed";

export type OrderStatus = "active" | "delivered" | "revision" | "approved";

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

export type User = {
  id: string;
  name: string;
  account?: string;
  phone?: string;
  password?: string;
  email: string;
  role: UserRole;
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
  cover: string;
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
  budget: number;
  deadline: string;
  status: ProjectStatus;
  referenceFile?: string;
  qualificationFile?: string;
  contactEmail?: string;
  contactPhone?: string;
  agentBrief?: AgentBrief;
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

export type ActivityEvent = {
  id: string;
  userId: string;
  role: UserRole;
  eventType: "login" | "browse" | "post_project" | "invite_creator" | "send_message" | "deliver_order" | "approve_order";
  targetType?: "creator" | "buyer_profile" | "project" | "order";
  targetId?: string;
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
  activityEvents: ActivityEvent[];
};
