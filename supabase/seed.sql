insert into public.users (id, name, email, role, created_at) values
('00000000-0000-0000-0000-000000000101', 'Mira Chen', 'mira@northstar.ai', 'buyer', '2026-04-20'),
('00000000-0000-0000-0000-000000000102', 'Leo Wang', 'leo@urbanline.co', 'buyer', '2026-04-24'),
('00000000-0000-0000-0000-000000000103', 'Admin', 'admin@marketplace.dev', 'admin', '2026-04-01'),
('00000000-0000-0000-0000-000000000201', 'Ava Studio', 'ava@studio.ai', 'creator', '2026-04-10'),
('00000000-0000-0000-0000-000000000202', 'Kai Motion', 'kai@motion.ai', 'creator', '2026-04-12'),
('00000000-0000-0000-0000-000000000203', 'Luna Visuals', 'luna@visuals.ai', 'creator', '2026-04-13'),
('00000000-0000-0000-0000-000000000204', 'Noah Avatar Lab', 'noah@avatar.ai', 'creator', '2026-04-14'),
('00000000-0000-0000-0000-000000000205', 'Iris Commerce', 'iris@commerce.ai', 'creator', '2026-04-15'),
('00000000-0000-0000-0000-000000000206', 'Echo Ads', 'echo@ads.ai', 'creator', '2026-04-17'),
('00000000-0000-0000-0000-000000000207', 'Vera Brand AI', 'vera@brand.ai', 'creator', '2026-04-19'),
('00000000-0000-0000-0000-000000000208', 'Pixel Harbor', 'pixel@harbor.ai', 'creator', '2026-04-21'),
('00000000-0000-0000-0000-000000000209', 'Synth Crew', 'synth@crew.ai', 'creator', '2026-04-22'),
('00000000-0000-0000-0000-000000000210', 'Moss Content', 'moss@content.ai', 'creator', '2026-04-23');

insert into public.creator_profiles (id, user_id, title, location, bio, skills, categories, portfolio, price_min, price_max, completed_projects, rating, response_time, verified, cover) values
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000201', 'AI product video studio', 'Hangzhou', 'Turns product briefs into short launch videos with storyboards, AI footage, captions, and final edit.', array['Runway','CapCut','Storyboard','E-commerce'], array['AI Short Video']::public.project_category[], array['Beauty product launch','Tmall 15s ad','Crowdfunding teaser'], 120, 650, 38, 4.90, '2h', true, 'linear-gradient(135deg, #16724f, #1d8a99)'),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000202', 'Performance ad creator', 'Shanghai', 'Builds fast-turn UGC-style AI ads, hook variants, and thumb-stopping motion for paid social.', array['AI Ads','Hooks','Editing','TikTok'], array['AI Short Video','Digital Human']::public.project_category[], array['SaaS explainer','Fitness ad pack','App install creatives'], 180, 900, 56, 4.80, '1h', true, 'linear-gradient(135deg, #2457c5, #16a085)'),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000203', 'AI image designer', 'Guangzhou', 'Creates marketplace hero images, product scenes, poster sets, and visual style systems.', array['Midjourney','Photoshop','Retouching','Brand Kit'], array['Image Design']::public.project_category[], array['Skincare scene set','Kitchen product posters','Lifestyle image bank'], 60, 420, 71, 4.95, '3h', true, 'linear-gradient(135deg, #166b8f, #c06f24)'),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000204', 'Digital human presenter team', 'Beijing', 'Produces avatar spokesperson videos with script polish, voice sync, subtitles, and brand templates.', array['Digital Human','Script','Voiceover','Localization'], array['Digital Human']::public.project_category[], array['Course intro host','Livestream teaser','B2B product demo'], 220, 1200, 29, 4.70, '4h', true, 'linear-gradient(135deg, #33423b, #2457c5)'),
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000205', 'AIGC e-commerce content partner', 'Shenzhen', 'Combines product listing visuals, short videos, and delivery-ready copy for online stores.', array['Listing Images','Short Video','Copywriting','Amazon'], array['AI Short Video','Image Design']::public.project_category[], array['Amazon image stack','Pet product video','Holiday campaign visuals'], 90, 760, 44, 4.85, '2h', true, 'linear-gradient(135deg, #0d563a, #a86612)'),
('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000206', 'AI ad testing operator', 'Chengdu', 'Creates multi-version ad bundles with copy angles, creator-style scenes, and rapid iteration.', array['Ad Variants','Meta Ads','Runway','Iteration'], array['AI Short Video']::public.project_category[], array['DTC ad sprint','Game launch variants','Education lead gen'], 150, 840, 33, 4.65, '1 day', false, 'linear-gradient(135deg, #2457c5, #a86612)'),
('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000207', 'Brand visual director', 'Hangzhou', 'Builds consistent AI visual systems for founders, educators, and new consumer brands.', array['Art Direction','Brand Kit','Prompt System','Design'], array['Image Design']::public.project_category[], array['Founder image system','Cafe visual kit','Course posters'], 210, 1400, 22, 4.90, '5h', true, 'linear-gradient(135deg, #16724f, #c45d4c)'),
('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000208', 'Product scene generator', 'Ningbo', 'Specializes in clean product renders, scene expansion, and catalog image refreshes.', array['Product Render','Retouching','Catalog','Midjourney'], array['Image Design']::public.project_category[], array['Furniture catalog','Outdoor gear scenes','Appliance render set'], 50, 300, 61, 4.75, '2h', true, 'linear-gradient(135deg, #1d8a99, #33423b)'),
('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000209', 'Avatar and voice pipeline', 'Wuhan', 'Delivers digital human clips for product demos, training, and multilingual explainers.', array['Avatar','Voice Clone','Subtitles','Training Video'], array['Digital Human','AI Short Video']::public.project_category[], array['Insurance explainer','HR onboarding host','Retail training clip'], 260, 1500, 18, 4.60, '6h', false, 'linear-gradient(135deg, #0d563a, #2457c5)'),
('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000210', 'Content package operator', 'Suzhou', 'Packages images, short clips, captions, and revisions for lean teams launching fast.', array['Content Pack','Captions','Images','Revisions'], array['AI Short Video','Image Design','Digital Human']::public.project_category[], array['Restaurant opening pack','Education content kit','B2B weekly content'], 80, 680, 47, 4.82, '3h', true, 'linear-gradient(135deg, #16724f, #2457c5)');

insert into public.projects (id, buyer_id, title, description, category, budget, deadline, status, reference_file, created_at) values
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', '15-second AI video for smart desk lamp launch', 'Need three hook variants, product close-ups, subtitles, and final vertical exports for paid social.', 'AI Short Video', 520, '2026-06-02', 'matching', 'lamp-brief.pdf', '2026-05-10'),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000102', 'Marketplace image set for bathroom storage rack', 'Create clean product usage scenes for Taobao listing. Need main image, detail images, and one banner.', 'Image Design', 260, '2026-05-30', 'open', 'rack-photos.zip', '2026-05-12'),
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000101', 'Digital human explainer for B2B SaaS onboarding', 'One polished presenter video with script refinement, neutral business style, and Chinese subtitles.', 'Digital Human', 980, '2026-06-08', 'in_progress', null, '2026-05-14'),
('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000102', 'AI poster series for summer cafe campaign', 'Need a consistent visual direction and six posters for WeChat, Xiaohongshu, and in-store screens.', 'Image Design', 680, '2026-06-05', 'matching', null, '2026-05-16'),
('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000101', 'Avatar livestream teaser for online course', 'Produce a digital human teaser with friendly host, course value points, and two revision rounds.', 'Digital Human', 760, '2026-06-01', 'completed', null, '2026-05-01');

insert into public.project_matches (project_id, creator_id, score, reason) values
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 94, 'Strong AI short video category fit and ad testing skills.'),
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 90, 'Product launch portfolio and budget fit.'),
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 86, 'E-commerce content package experience.'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000008', 92, 'Product scene and catalog specialization.'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 89, 'Marketplace image production and retouching.'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000010', 81, 'Budget fit with mixed content package skills.');

insert into public.orders (id, project_id, buyer_id, creator_id, amount, status, deliverable_url, created_at) values
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000004', 980, 'active', null, '2026-05-17'),
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000009', 760, 'approved', 'https://example.com/course-avatar-final.mp4', '2026-05-04');

insert into public.messages (order_id, sender_id, body, attachment_url, created_at) values
('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Please keep the presenter tone calm and enterprise-friendly.', null, '2026-05-18T09:30:00Z'),
('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000204', 'Got it. I will send a script polish pass before rendering.', null, '2026-05-18T10:04:00Z'),
('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000204', 'First script draft is ready for review.', 'https://example.com/script-v1.docx', '2026-05-19T08:15:00Z');

insert into public.reviews (order_id, buyer_id, creator_id, rating, comment, created_at) values
('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000009', 5, 'Fast delivery and the avatar style matched the course brand.', '2026-05-12');

insert into public.activity_events (id, user_id, role, event_type, target_type, target_id, created_at) values
('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'buyer', 'login', null, null, '2026-05-02T09:00:00Z'),
('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000101', 'buyer', 'post_project', 'project', '20000000-0000-0000-0000-000000000001', '2026-05-10T10:20:00Z'),
('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000101', 'buyer', 'invite_creator', 'order', '30000000-0000-0000-0000-000000000001', '2026-05-18T11:00:00Z'),
('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000102', 'buyer', 'login', null, null, '2026-05-08T13:00:00Z'),
('40000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000102', 'buyer', 'post_project', 'project', '20000000-0000-0000-0000-000000000002', '2026-05-12T15:00:00Z'),
('40000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000202', 'creator', 'deliver_order', 'order', '30000000-0000-0000-0000-000000000001', '2026-05-21T12:20:00Z'),
('40000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000204', 'creator', 'send_message', 'order', '30000000-0000-0000-0000-000000000001', '2026-05-18T10:04:00Z'),
('40000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000209', 'creator', 'deliver_order', 'order', '30000000-0000-0000-0000-000000000002', '2026-05-10T17:00:00Z');
