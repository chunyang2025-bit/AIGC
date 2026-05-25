import type { Metadata } from "next";
import { BriefcaseBusiness, LogIn, Plus, Search, Sparkles, UsersRound } from "lucide-react";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "灵工智创平台",
  description: "连接需求发布方与AIGC创作者的AI内容生产经纪网络。"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              body{margin:0;background:#f7f8f5;color:#15201b;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
              a{color:inherit;text-decoration:none}.shell{min-height:100vh}.nav{position:sticky;top:0;z-index:10;display:flex;align-items:center;justify-content:space-between;gap:24px;min-height:68px;padding:0 32px;border-bottom:1px solid rgba(21,32,27,.08);background:rgba(247,248,245,.92);backdrop-filter:blur(16px)}
              .brand,.navLinks a,.btn,.row{display:inline-flex;align-items:center;gap:8px}.brand{font-weight:750}.brandMark,.avatar{display:grid;place-items:center;border-radius:8px;color:#fff;background:#15201b}.brandMark{width:34px;height:34px}.avatar{width:44px;height:44px;background:#16724f;font-weight:800}
              .navLinks{display:flex;gap:8px;color:#66736c;font-size:14px}.navLinks a{padding:10px 12px;border-radius:8px}.navActions,.toolbarGroup{display:flex;gap:10px;align-items:center}.main{width:min(1180px,calc(100% - 40px));margin:0 auto;padding:28px 0 56px}
              .btn{justify-content:center;min-height:40px;padding:0 14px;border:1px solid #dfe6df;border-radius:8px;background:#fff;font-weight:650;font-size:14px}.btn.primary{border-color:#16724f;background:#16724f;color:#fff}.hero{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(360px,.95fr);gap:28px;align-items:stretch;padding:32px 0 22px}
              .hero h1{margin:0;font-size:clamp(42px,6vw,76px);line-height:.95}.hero p{margin:0;color:#66736c;font-size:18px;line-height:1.65}.heroCopy,.stack{display:grid;gap:16px}.card,.heroPanel,.metric{border:1px solid #dfe6df;border-radius:8px;background:#fff}.cardBody{padding:16px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.grid.four{grid-template-columns:repeat(4,minmax(0,1fr))}.tag{display:inline-flex;align-items:center;gap:5px;min-height:26px;padding:0 8px;border:1px solid #dfe6df;border-radius:8px;color:#66736c;background:#fbfcfa;font-size:12px;font-weight:650}.tag.green{color:#0d563a;background:#eef8f0}.tag.blue{color:#1b4cac;background:#eef4ff}.section{padding:30px 0}.metric{display:grid;gap:4px;padding:15px}.metric strong{font-size:26px}.metric span,.muted{color:#66736c}@media(max-width:920px){.nav{align-items:flex-start;flex-direction:column;padding:14px 20px}.hero,.grid,.grid.four{grid-template-columns:1fr}.navLinks,.navActions{width:100%;overflow-x:auto}}
            `
          }}
        />
      </head>
      <body>
        <div className="shell">
          <header className="nav">
            <Link className="brand" href="/">
              <span className="brandMark">
                <Sparkles size={18} />
              </span>
              <span>灵工智创平台</span>
            </Link>
            <nav className="navLinks" aria-label="Primary navigation">
              <Link href="/creators">
                <Search size={16} /> 创作者
              </Link>
              <Link href="/projects">
                <BriefcaseBusiness size={16} /> 公开需求
              </Link>
              <Link href="/admin">
                <UsersRound size={16} /> 运营后台
              </Link>
            </nav>
            <div className="navActions">
              <Link className="btn ghost" href="/login">
                <LogIn size={16} /> 我要接单
              </Link>
              <Link className="btn primary" href="/post-project">
                <Plus size={16} /> 我要派单
              </Link>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
