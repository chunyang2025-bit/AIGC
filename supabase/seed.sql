insert into app_users (id, name, email, role, created_at) values
('u-buyer-1', '杭州北辰智能科技', 'mira@northstar.ai', 'buyer', '2026-04-20'),
('u-buyer-2', '城野生活电商', 'leo@urbanline.co', 'buyer', '2026-04-24'),
('u-buyer-3', '云上课程工作室', 'course@cloudclass.cn', 'buyer', '2026-05-02'),
('u-admin-1', '平台运营管理员', 'admin@marketplace.dev', 'admin', '2026-04-01'),
('u-creator-1', '阿鹿影像工坊', 'ava@studio.ai', 'creator', '2026-04-10'),
('u-creator-2', '开物短视频', 'kai@motion.ai', 'creator', '2026-04-12'),
('u-creator-3', '露娜视觉', 'luna@visuals.ai', 'creator', '2026-04-13'),
('u-creator-4', '诺亚数字人实验室', 'noah@avatar.ai', 'creator', '2026-04-14'),
('u-creator-5', '艾瑞电商内容', 'iris@commerce.ai', 'creator', '2026-04-15'),
('u-creator-6', '回声广告组', 'echo@ads.ai', 'creator', '2026-04-17'),
('u-creator-7', '薇拉品牌AI', 'vera@brand.ai', 'creator', '2026-04-19'),
('u-creator-8', '像素港产品图', 'pixel@harbor.ai', 'creator', '2026-04-21'),
('u-creator-9', '合成空间', 'synth@crew.ai', 'creator', '2026-04-22'),
('u-creator-10', '青苔内容包', 'moss@content.ai', 'creator', '2026-04-23')
on conflict (id) do update set
name = excluded.name,
email = excluded.email,
role = excluded.role;

insert into buyer_profiles (
  id, user_id, company_name, display_name, avatar_url, profile_slogan, industry, location,
  company_intro, verification_type, contact_email, contact_phone, website_url, social_url,
  service_area, business_license_file, qualification_files, verified, cover
) values
('bp-1', 'u-buyer-1', '杭州北辰智能科技', '北辰智能内容需求中心', '北', '长期寻找懂智能硬件和B端软件的AIGC内容伙伴', '智能硬件 / SaaS', '杭州', '专注智能办公硬件和企业效率工具，常年需要产品短视频、SaaS说明视频和电商内容素材。', 'enterprise', 'mira@northstar.ai', '0571-8800-1024', 'https://northstar.example.com', 'https://www.xiaohongshu.com/user/profile/northstar', '全国远程协作，杭州可线下面谈', '杭州北辰智能科技营业执照.pdf', '["品牌授权书.pdf","智能台灯产品检测说明.pdf"]'::jsonb, true, 'linear-gradient(135deg, #153f31, #2457c5)'),
('bp-2', 'u-buyer-2', '城野生活电商', '城野生活内容组', '城', '家居日用商家，持续招募商品图和短视频创作者', '家居日用 / 电商', '上海', '经营家居收纳、清洁用品和生活方式小商品，主要在淘宝、小红书和抖音渠道做内容测试。', 'individual_business', 'leo@urbanline.co', '021-6800-2210', 'https://urbanline.example.com', 'https://www.douyin.com/user/urbanline', '全国远程协作', '城野生活电商营业执照.pdf', '["商标使用证明.pdf"]'::jsonb, true, 'linear-gradient(135deg, #16724f, #a86612)'),
('bp-3', 'u-buyer-3', '云上课程工作室', '云上课程内容需求', '云', '在线课程团队，重点寻找数字人和课程短视频伙伴', '在线教育 / 知识服务', '成都', '面向职场人提供线上课程和训练营，需要数字人口播、课程预告和社群转化内容。', 'school', 'course@cloudclass.cn', '028-6100-8899', 'https://cloudclass.example.com', 'https://www.bilibili.com/cloudclass', '全国远程协作', '云上课程工作室主体资质.pdf', '["课程版权说明.pdf"]'::jsonb, false, 'linear-gradient(135deg, #2457c5, #1d8a99)')
on conflict (id) do update set
company_name = excluded.company_name,
display_name = excluded.display_name,
verified = excluded.verified;

insert into creator_profiles (
  id, user_id, name, title, location, bio, resume, skills, categories, portfolio,
  price_min, price_max, completed_projects, rating, response_time, verified,
  identity_type, verification_type, credential_file, qualification_files, avatar_url,
  display_name, profile_slogan, website_url, social_url, service_area, contact_email,
  contact_phone, cover
) values
('c-1', 'u-creator-1', '阿鹿影像工坊', 'AI商品短视频工作室', '杭州', '把商品卖点整理成脚本、分镜、AI素材和成片，适合新品首发和电商投放。', '服务过美妆、智能硬件和众筹产品团队，擅长从产品卖点提炼到短视频脚本、分镜和成片包装。', '["Runway","剪映","分镜脚本","电商"]'::jsonb, '["AI Short Video"]'::jsonb, '["美妆新品短片","天猫15秒广告","众筹产品预热视频"]'::jsonb, 880, 4500, 38, 4.9, '2小时', true, 'enterprise', 'enterprise', '阿鹿影像工坊营业执照.pdf', '["作品授权展示说明.pdf"]'::jsonb, '鹿', '阿鹿影像工坊', 'AI商品短视频工作室', 'https://ava-studio.example.com', 'https://www.xiaohongshu.com/user/profile/ava-studio', '全国远程协作，杭州可线下面谈', 'ava@studio.ai', '0571-8800-2001', 'linear-gradient(135deg, #16724f, #1d8a99)'),
('c-2', 'u-creator-2', '开物短视频', '效果广告短视频创作者', '上海', '制作UGC风格AI广告、前三秒钩子、多版本脚本和竖屏投放素材。', '长期服务效果广告和App拉新团队，熟悉多钩子脚本、投放素材变体和快速复盘迭代。', '["AI广告","钩子脚本","剪辑","短视频投放"]'::jsonb, '["AI Short Video","Digital Human"]'::jsonb, '["SaaS解释视频","健身产品广告包","App拉新素材"]'::jsonb, 1200, 6200, 56, 4.8, '1小时', true, 'enterprise', 'enterprise', '开物短视频营业执照.pdf', '["广告素材案例授权.pdf"]'::jsonb, '开', '开物短视频', '效果广告短视频创作者', 'https://kai-motion.example.com', 'https://www.douyin.com/user/kai-motion', '全国远程协作', 'kai@motion.ai', '021-6800-1122', 'linear-gradient(135deg, #2457c5, #16a085)'),
('c-3', 'u-creator-3', '露娜视觉', 'AI商品图与海报设计师', '广州', '为电商、品牌活动和小红书内容生成主图、场景图、海报套图和视觉规范。', '专注AI商品图、海报和品牌视觉，参与过护肤品、厨房用品和生活方式素材库项目。', '["Midjourney","PS精修","商品图","品牌视觉"]'::jsonb, '["Image Design"]'::jsonb, '["护肤品场景图","厨房用品详情图","生活方式素材库"]'::jsonb, 399, 2800, 71, 4.95, '3小时', true, 'individual', 'individual', '露娜视觉个人实名核验记录', '["平台作品展示授权.pdf"]'::jsonb, '露', '露娜视觉', 'AI商品图与海报设计师', 'https://luna-visual.example.com', 'https://www.behance.net/luna-visual', '全国远程协作', 'luna@visuals.ai', '020-8100-3344', 'linear-gradient(135deg, #166b8f, #c06f24)'),
('c-4', 'u-creator-4', '诺亚数字人实验室', '数字人口播交付团队', '北京', '提供数字人出镜、脚本润色、配音口型、字幕和品牌模板，适合课程、SaaS和招商说明。', '数字人口播交付团队，覆盖课程介绍、直播预热、B端产品演示和招商说明类内容。', '["数字人","脚本","配音","字幕"]'::jsonb, '["Digital Human"]'::jsonb, '["课程介绍口播","直播预热视频","B端产品演示"]'::jsonb, 1500, 8800, 29, 4.7, '4小时', true, 'enterprise', 'enterprise', '诺亚数字人实验室营业执照.pdf', '[]'::jsonb, '诺', '诺亚数字人实验室', '数字人口播交付团队', '', '', '全国远程协作', 'noah@avatar.ai', '010-8800-2244', 'linear-gradient(135deg, #33423b, #2457c5)'),
('c-5', 'u-creator-5', '艾瑞电商内容', 'AIGC电商内容服务商', '深圳', '组合交付商品图、短视频、详情文案和平台上架素材，适合中小商家快速测款。', '面向中小商家提供电商内容包，熟悉淘宝、京东、亚马逊等渠道的图片和短视频素材。', '["详情图","短视频","卖点文案","淘宝京东"]'::jsonb, '["AI Short Video","Image Design"]'::jsonb, '["亚马逊图片包","宠物用品短片","节日营销视觉"]'::jsonb, 680, 5200, 44, 4.85, '2小时', true, 'enterprise', 'enterprise', '艾瑞电商内容营业执照.pdf', '[]'::jsonb, '艾', '艾瑞电商内容', 'AIGC电商内容服务商', '', '', '全国远程协作', 'iris@commerce.ai', '0755-8800-5566', 'linear-gradient(135deg, #0d563a, #a86612)'),
('c-6', 'u-creator-6', '回声广告组', 'AI广告批量测试团队', '成都', '按投放角度批量生成广告素材，支持多版本脚本、画面、字幕和快速复盘迭代。', '擅长广告素材批量测试，为DTC、游戏、教育线索广告提供多版本创意和字幕包装。', '["广告变体","信息流","Runway","迭代"]'::jsonb, '["AI Short Video"]'::jsonb, '["DTC广告冲刺","游戏上线素材","教育线索广告"]'::jsonb, 1000, 5800, 33, 4.65, '1天', false, 'enterprise', 'enterprise', '回声广告组营业执照.pdf', '[]'::jsonb, '回', '回声广告组', 'AI广告批量测试团队', '', '', '全国远程协作', 'echo@ads.ai', '028-8800-1100', 'linear-gradient(135deg, #2457c5, #a86612)'),
('c-7', 'u-creator-7', '薇拉品牌AI', 'AI品牌视觉主理人', '杭州', '为新消费、教育和本地品牌搭建统一的AI视觉方向、提示词体系和内容模板。', '品牌AI视觉主理人，参与过创始人形象、咖啡店视觉包和课程宣传海报项目。', '["视觉指导","品牌套件","提示词系统","设计"]'::jsonb, '["Image Design"]'::jsonb, '["创始人形象系统","咖啡店视觉包","课程宣传海报"]'::jsonb, 1500, 9800, 22, 4.9, '5小时', true, 'individual', 'individual', '薇拉品牌AI实名核验记录', '[]'::jsonb, '薇', '薇拉品牌AI', 'AI品牌视觉主理人', '', '', '全国远程协作', 'vera@brand.ai', '0571-8800-7711', 'linear-gradient(135deg, #16724f, #c45d4c)'),
('c-8', 'u-creator-8', '像素港产品图', 'AI商品场景图生成师', '宁波', '专注干净的商品渲染、场景扩图和目录图片翻新。', '擅长家具、户外用品、小家电等品类商品场景图。', '["商品渲染","精修","目录图","Midjourney"]'::jsonb, '["Image Design"]'::jsonb, '["家具目录","户外用品场景","小家电渲染图"]'::jsonb, 300, 2200, 61, 4.75, '2小时', true, 'individual_business', 'individual_business', '像素港个体工商户执照.pdf', '[]'::jsonb, '像', '像素港产品图', 'AI商品场景图生成师', '', '', '全国远程协作', 'pixel@harbor.ai', '0574-8800-2233', 'linear-gradient(135deg, #1d8a99, #33423b)'),
('c-9', 'u-creator-9', '合成空间', '数字人与声音管线', '武汉', '交付产品演示、培训和多语言讲解类数字人内容。', '覆盖保险讲解、HR入职培训、零售培训等场景。', '["数字人","声音克隆","字幕","培训视频"]'::jsonb, '["Digital Human","AI Short Video"]'::jsonb, '["保险讲解","HR入职主持","零售培训短片"]'::jsonb, 1800, 12000, 18, 4.6, '6小时', false, 'enterprise', 'enterprise', '合成空间营业执照.pdf', '[]'::jsonb, '合', '合成空间', '数字人与声音管线', '', '', '全国远程协作', 'synth@crew.ai', '027-8800-8899', 'linear-gradient(135deg, #0d563a, #2457c5)'),
('c-10', 'u-creator-10', '青苔内容包', '内容包交付操盘手', '苏州', '为轻量团队打包交付图片、短片、标题文案和修改版本。', '服务餐饮开业、教育内容包、B端周更内容等需求。', '["内容包","标题文案","图片","修改"]'::jsonb, '["AI Short Video","Image Design","Digital Human"]'::jsonb, '["餐厅开业内容包","教育内容套件","B端周更内容"]'::jsonb, 500, 4600, 47, 4.82, '3小时', true, 'individual', 'individual', '青苔内容包实名核验记录', '[]'::jsonb, '青', '青苔内容包', '内容包交付操盘手', '', '', '全国远程协作', 'moss@content.ai', '0512-8800-3322', 'linear-gradient(135deg, #16724f, #2457c5)')
on conflict (id) do update set
name = excluded.name,
title = excluded.title,
verified = excluded.verified;

update creator_profiles
set
  categories = '["Digital Human","AIGC Training"]'::jsonb,
  training_profile = '{"topics":["数字人实战","AI课程内容","AI营销视频"],"formats":["online","workshop","offline"],"audience":["市场团队","课程团队","企业培训负责人"],"cities":["全国线上","北京","天津"],"caseStudies":["为在线教育团队完成数字人口播工作坊，25人，1天实操","为SaaS客户成功团队设计AI讲解视频内训"],"materials":["课件","练习素材","工具清单","课后答疑"],"pricingNote":"支持半日工作坊、1天内训和按项目陪跑报价。","customizable":true}'::jsonb
where id = 'c-4';

update creator_profiles
set
  categories = '["Digital Human","AI Short Video","AIGC Training"]'::jsonb,
  training_profile = '{"topics":["AI办公提效","HR培训视频","零售门店培训","数字人课件"],"formats":["online","offline","coaching"],"audience":["HR团队","零售培训团队","运营团队"],"cities":["全国线上","武汉","长沙","杭州"],"caseStudies":["为HR团队制作入职培训数字人流程并辅导内部更新","为零售团队完成门店培训短片和课后资料包"],"materials":["课件","录播","练习任务","字幕模板"],"pricingNote":"支持按场、按天或长期内容更新陪跑。","customizable":true}'::jsonb
where id = 'c-9';

insert into projects (id, buyer_id, title, description, category, tags, budget, deadline, status, reference_file, created_at) values
('p-1', 'u-buyer-1', '智能台灯新品首发15秒AI短视频', '需要三版开头钩子、产品特写、字幕和竖屏成片，用于信息流投放。', 'AI Short Video', '["智能硬件","信息流","新品首发"]'::jsonb, 5200, '2026-06-02', 'matching', 'lamp-brief.pdf', '2026-05-10'),
('p-2', 'u-buyer-2', '浴室置物架电商商品图套装', '为淘宝详情页制作干净的使用场景图、主图和一张活动横幅。', 'Image Design', '["商品图","家居日用","淘宝"]'::jsonb, 2600, '2026-06-10', 'open', 'rack-photos.zip', '2026-05-12'),
('p-3', 'u-buyer-1', 'B端SaaS入门说明数字人视频', '需要一条商务风格数字人口播，包含脚本润色、中性配音和中文字幕。', 'Digital Human', '["SaaS","数字人","说明视频"]'::jsonb, 9800, '2026-06-08', 'in_progress', null, '2026-05-14'),
('p-4', 'u-buyer-2', '夏季咖啡活动AI海报系列', '需要统一视觉方向和6张海报，用于微信、小红书和店内屏幕。', 'Image Design', '["海报","小红书","本地品牌"]'::jsonb, 6800, '2026-06-05', 'matching', null, '2026-05-16'),
('p-5', 'u-buyer-3', '线上课程数字人预热视频', '制作亲和力数字人预告，突出课程价值点和社群转化，两轮修改。', 'Digital Human', '["在线课程","预热视频","数字人"]'::jsonb, 7600, '2026-06-01', 'completed', null, '2026-05-01'),
('p-6', 'u-buyer-2', '电商团队AIGC商品内容内训', '希望找一位讲师为运营和设计团队做AIGC商品图、短视频脚本和提示词实操培训，最好能结合家居日用商品案例。', 'AIGC Training', '["企业内训","AI商品图","提示词","工作坊"]'::jsonb, 15000, '2026-06-18', 'open', '家居日用商品案例与品牌资料.zip', '2026-05-27')
on conflict (id) do update set
title = excluded.title,
status = excluded.status;

update projects
set
  use_case = 'training',
  deliverable_types = '["other"]'::jsonb,
  urgency = 'this_week',
  need_invoice = true,
  long_term = true,
  accept_platform_recommend = true,
  training_requirement = '{"topics":["AI商品图","提示词工程","AI短视频脚本"],"audience":"电商运营和设计团队","headcount":28,"format":"offline","city":"上海","duration":"1天工作坊","goal":"让团队掌握商品图生成、卖点脚本和素材复用流程，形成可复用模板。","needCustomCases":true,"needMaterials":true}'::jsonb,
  qualification_file = '城野生活电商营业执照.pdf',
  contact_email = 'leo@urbanline.co',
  contact_phone = '021-6800-2210',
  agent_brief = '{"objective":"为电商团队寻找AIGC培训讲师，完成商品图、提示词和短视频脚本实操训练。","audience":"电商运营、设计和内容团队","style":"实操、案例驱动、可落地","deliverables":["培训方案","1天线下工作坊","商品案例练习","课件和工具清单"],"acceptanceCriteria":["结合家居日用真实商品案例","学员能独立完成商品图提示词和短视频脚本","提供可复用模板和课后材料"],"suggestedQuestions":["是否能基于我们的商品案例定制练习？","是否提供课件和工具清单？","是否支持课后答疑或陪跑？"]}'::jsonb
where id = 'p-6';

insert into project_matches (id, project_id, creator_id, score, reason) values
('m-1', 'p-1', 'c-2', 94, '短视频品类匹配，具备广告测试经验。'),
('m-2', 'p-1', 'c-1', 90, '有产品首发视频作品，预算匹配。'),
('m-3', 'p-1', 'c-5', 86, '电商内容包经验适配。'),
('m-4', 'p-2', 'c-8', 92, '商品场景图与目录图经验突出。'),
('m-5', 'p-2', 'c-3', 89, '商品图和精修能力匹配。'),
('m-6', 'p-2', 'c-10', 81, '预算适配且可做组合内容包。'),
('m-10', 'p-6', 'c-9', 93, '培训主题、数字人课件和线下工作坊经验匹配。'),
('m-11', 'p-6', 'c-4', 88, '数字人与课程培训经验匹配，支持企业定制案例。')
on conflict (id) do update set score = excluded.score, reason = excluded.reason;

update project_matches
set
  risk = '讲师主体待审核，建议先确认企业内训案例和可开票方式。',
  next_step = '建议先确认培训对象、1天工作坊安排和家居商品案例范围。'
where id = 'm-10';

update project_matches
set
  risk = '报价可能接近预算上限，建议先确认半日/全天范围。',
  next_step = '建议确认课件、练习材料和课后答疑方式。'
where id = 'm-11';

insert into orders (id, project_id, buyer_id, creator_id, amount, status, deliverable_url, created_at) values
('o-1', 'p-3', 'u-buyer-1', 'c-4', 9800, 'active', null, '2026-05-17'),
('o-2', 'p-5', 'u-buyer-3', 'c-9', 7600, 'approved', 'https://example.com/course-avatar-final.mp4', '2026-05-04')
on conflict (id) do update set status = excluded.status;

insert into messages (id, order_id, sender_id, body, attachment_url, created_at) values
('msg-1', 'o-1', 'u-buyer-1', '请保持主持人口吻沉稳、偏企业服务风格。', null, '2026-05-18T09:30:00Z'),
('msg-2', 'o-1', 'u-creator-4', '收到。我会先发一版脚本润色稿，再进入渲染。', null, '2026-05-18T10:04:00Z'),
('msg-3', 'o-1', 'u-creator-4', '第一版脚本草稿已准备好。', 'https://example.com/script-v1.docx', '2026-05-19T08:15:00Z')
on conflict (id) do update set body = excluded.body;

insert into reviews (id, order_id, buyer_id, creator_id, rating, comment, created_at) values
('r-1', 'o-2', 'u-buyer-3', 'c-9', 5, '交付很快，数字人风格和课程品牌很匹配。', '2026-05-12')
on conflict (id) do update set rating = excluded.rating, comment = excluded.comment;

insert into activity_events (id, user_id, role, event_type, target_type, target_id, created_at) values
('a-1', 'u-buyer-1', 'buyer', 'login', null, null, '2026-05-02T09:00:00Z'),
('a-2', 'u-buyer-1', 'buyer', 'post_project', 'project', 'p-1', '2026-05-10T10:20:00Z'),
('a-3', 'u-buyer-1', 'buyer', 'invite_creator', 'order', 'o-1', '2026-05-18T11:00:00Z'),
('a-4', 'u-buyer-2', 'buyer', 'login', null, null, '2026-05-08T13:00:00Z'),
('a-5', 'u-buyer-2', 'buyer', 'post_project', 'project', 'p-2', '2026-05-12T15:00:00Z'),
('a-6', 'u-creator-2', 'creator', 'deliver_order', 'order', 'o-1', '2026-05-21T12:20:00Z'),
('a-7', 'u-creator-4', 'creator', 'send_message', 'order', 'o-1', '2026-05-18T10:04:00Z'),
('a-8', 'u-creator-9', 'creator', 'deliver_order', 'order', 'o-2', '2026-05-10T17:00:00Z')
on conflict (id) do update set created_at = excluded.created_at;
