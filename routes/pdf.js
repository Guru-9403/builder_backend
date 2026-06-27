const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

// ─── TEMPLATE HTML GENERATORS ───

const classicHTML = (resume, photo) => `
<div style="font-family:Georgia,serif;color:#1a1a1a;padding:60px 64px;background:#fff;min-height:1123px;box-sizing:border-box;">
  <div style="display:flex;align-items:flex-start;gap:24px;margin-bottom:6px;">
    ${photo ? `<img src="${photo}" style="width:100px;height:100px;border-radius:50%;object-fit:cover;border:2px solid #1a1a1a;flex-shrink:0;" />` : ''}
    <div style="flex:1;">
      ${resume.name ? `<h1 style="font-size:32px;font-weight:700;margin:0 0 6px;letter-spacing:1px;">${resume.name}</h1>` : ''}
      <div style="display:flex;flex-wrap:wrap;gap:14px;font-size:13px;color:#555;">
        ${resume.email ? `<span>✉ ${resume.email}</span>` : ''}
        ${resume.phone ? `<span>📞 ${resume.phone}</span>` : ''}
        ${resume.location ? `<span>📍 ${resume.location}</span>` : ''}
        ${resume.linkedin ? `<span>🔗 ${resume.linkedin}</span>` : ''}
      </div>
    </div>
  </div>
  <hr style="border:none;border-top:2px solid #1a1a1a;margin:16px 0;" />
  ${resume.summary ? `<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Summary</div><p style="font-size:14px;line-height:1.8;margin:0 0 16px;color:#333;">${resume.summary}</p><hr style="border:none;border-top:1px solid #ccc;margin:0 0 16px;" />` : ''}
  ${resume.experience?.length ? `
    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Experience</div>
    ${resume.experience.map(exp => `
      <div style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <span style="font-weight:700;font-size:15px;">${exp.title || ''}${exp.company ? `<span style="font-weight:400;color:#666;font-style:italic;font-size:14px;"> @ ${exp.company}</span>` : ''}</span>
          <span style="font-size:13px;color:#888;">${exp.duration || ''}</span>
        </div>
        ${exp.bullets?.length ? `<ul style="padding-left:20px;margin:6px 0 0;">${exp.bullets.map(b => `<li style="font-size:13px;line-height:1.8;margin-bottom:3px;color:#333;">${b}</li>`).join('')}</ul>` : ''}
      </div>`).join('')}
    <hr style="border:none;border-top:1px solid #ccc;margin:0 0 16px;" />` : ''}
  ${resume.education?.length ? `
    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Education</div>
    ${resume.education.map(edu => `<div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:8px;"><span><strong>${edu.degree || ''}</strong>${edu.school ? ` — ${edu.school}` : ''}</span><span style="color:#888;font-size:13px;">${edu.year || ''}</span></div>`).join('')}
    <hr style="border:none;border-top:1px solid #ccc;margin:16px 0;" />` : ''}
  ${resume.skills?.length ? `
    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px;">Skills</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;">${resume.skills.map(s => `<span style="background:#f0f0f0;padding:4px 12px;border-radius:14px;font-size:13px;color:#333;">${s}</span>`).join('')}</div>` : ''}
</div>`;

const modernHTML = (resume, photo) => `
<div style="display:flex;font-family:Inter,sans-serif;min-height:1123px;background:#fff;">
  <div style="width:38%;background:#7C3AED;color:#fff;padding:48px 28px;box-sizing:border-box;">
    ${photo ? `<img src="${photo}" style="width:100px;height:100px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,0.5);margin-bottom:16px;display:block;" />` : ''}
    ${resume.name ? `<h1 style="font-size:22px;font-weight:700;margin:0 0 6px;line-height:1.3;">${resume.name}</h1>` : ''}
    <div style="font-size:12px;opacity:0.8;margin-bottom:28px;line-height:1.8;">
      ${resume.email ? `<div>✉ ${resume.email}</div>` : ''}
      ${resume.phone ? `<div>📞 ${resume.phone}</div>` : ''}
      ${resume.location ? `<div>📍 ${resume.location}</div>` : ''}
      ${resume.linkedin ? `<div>🔗 ${resume.linkedin}</div>` : ''}
    </div>
    ${resume.skills?.length ? `<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;opacity:0.7;">Skills</div>${resume.skills.map(s => `<div style="background:rgba(255,255,255,0.15);padding:6px 10px;border-radius:4px;font-size:12px;margin-bottom:6px;">${s}</div>`).join('')}` : ''}
    ${resume.education?.length ? `<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:24px 0 12px;opacity:0.7;">Education</div>${resume.education.map(edu => `<div style="margin-bottom:10px;"><div style="font-weight:700;font-size:13px;">${edu.degree || ''}</div><div style="font-size:12px;opacity:0.8;">${edu.school || ''}</div><div style="font-size:11px;opacity:0.6;">${edu.year || ''}</div></div>`).join('')}` : ''}
  </div>
  <div style="flex:1;padding:48px 32px;box-sizing:border-box;">
    ${resume.summary ? `<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#7C3AED;margin-bottom:10px;">About Me</div><p style="font-size:13px;line-height:1.8;color:#444;margin-bottom:24px;">${resume.summary}</p>` : ''}
    ${resume.experience?.length ? `
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#7C3AED;margin-bottom:14px;">Experience</div>
      ${resume.experience.map(exp => `
        <div style="margin-bottom:18px;padding-left:14px;border-left:3px solid #7C3AED;">
          <div style="font-weight:700;font-size:15px;color:#1a1a1a;">${exp.title || ''}</div>
          <div style="font-size:13px;color:#7C3AED;margin-bottom:6px;">${exp.company || ''} · ${exp.duration || ''}</div>
          ${exp.bullets?.map(b => `<div style="font-size:13px;color:#555;line-height:1.7;margin-bottom:3px;">• ${b}</div>`).join('') || ''}
        </div>`).join('')}` : ''}
  </div>
</div>`;

const minimalHTML = (resume, photo) => `
<div style="font-family:Inter,sans-serif;color:#2d2d2d;padding:60px 64px;background:#fff;min-height:1123px;box-sizing:border-box;">
  <div style="display:flex;align-items:center;gap:20px;margin-bottom:32px;">
    ${photo ? `<img src="${photo}" style="width:90px;height:90px;border-radius:8px;object-fit:cover;flex-shrink:0;" />` : ''}
    <div>
      ${resume.name ? `<h1 style="font-size:34px;font-weight:300;margin:0 0 6px;letter-spacing:3px;text-transform:uppercase;">${resume.name}</h1>` : ''}
      <div style="display:flex;gap:20px;font-size:12px;color:#999;">
        ${resume.email ? `<span>${resume.email}</span>` : ''}
        ${resume.phone ? `<span>${resume.phone}</span>` : ''}
        ${resume.location ? `<span>${resume.location}</span>` : ''}
      </div>
    </div>
  </div>
  ${resume.summary ? `<div style="height:1px;background:#e0e0e0;margin-bottom:20px;"></div><p style="font-size:13px;line-height:1.9;color:#666;margin:0 0 24px;">${resume.summary}</p>` : ''}
  ${resume.experience?.length ? `
    <div style="height:1px;background:#e0e0e0;margin-bottom:20px;"></div>
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:3px;color:#999;margin-bottom:16px;">Experience</div>
    ${resume.experience.map(exp => `
      <div style="display:flex;gap:20px;margin-bottom:18px;">
        <div style="font-size:12px;color:#999;width:90px;flex-shrink:0;padding-top:2px;">${exp.duration || ''}</div>
        <div style="flex:1;">
          <div style="font-weight:600;font-size:15px;margin-bottom:3px;">${exp.title || ''}</div>
          <div style="font-size:13px;color:#0F766E;margin-bottom:8px;">${exp.company || ''}</div>
          ${exp.bullets?.map(b => `<div style="font-size:13px;color:#666;line-height:1.7;margin-bottom:3px;">— ${b}</div>`).join('') || ''}
        </div>
      </div>`).join('')}` : ''}
  ${resume.education?.length ? `
    <div style="height:1px;background:#e0e0e0;margin-bottom:20px;"></div>
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:3px;color:#999;margin-bottom:16px;">Education</div>
    ${resume.education.map(edu => `<div style="display:flex;gap:20px;margin-bottom:10px;"><div style="font-size:12px;color:#999;width:90px;flex-shrink:0;">${edu.year || ''}</div><div><div style="font-weight:600;font-size:14px;">${edu.degree || ''}</div><div style="font-size:13px;color:#666;">${edu.school || ''}</div></div></div>`).join('')}` : ''}
  ${resume.skills?.length ? `
    <div style="height:1px;background:#e0e0e0;margin:20px 0;"></div>
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:3px;color:#999;margin-bottom:14px;">Skills</div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;">${resume.skills.map(s => `<span style="font-size:12px;color:#555;border:1px solid #ddd;padding:4px 12px;border-radius:2px;">${s}</span>`).join('')}</div>` : ''}
</div>`;

const boldHTML = (resume, photo) => `
<div style="font-family:Inter,sans-serif;background:#fff;min-height:1123px;">
  <div style="background:#1E3A5F;color:#fff;padding:40px 48px;display:flex;align-items:center;gap:24px;">
    ${photo ? `<img src="${photo}" style="width:100px;height:100px;border-radius:50%;object-fit:cover;border:3px solid #F59E0B;flex-shrink:0;" />` : ''}
    <div style="flex:1;">
      ${resume.name ? `<h1 style="font-size:32px;font-weight:800;margin:0 0 10px;text-transform:uppercase;letter-spacing:3px;">${resume.name}</h1>` : ''}
      <div style="display:flex;flex-wrap:wrap;gap:18px;font-size:12px;opacity:0.85;">
        ${resume.email ? `<span>✉ ${resume.email}</span>` : ''}
        ${resume.phone ? `<span>📞 ${resume.phone}</span>` : ''}
        ${resume.location ? `<span>📍 ${resume.location}</span>` : ''}
        ${resume.linkedin ? `<span>🔗 ${resume.linkedin}</span>` : ''}
      </div>
    </div>
  </div>
  <div style="padding:36px 48px;">
    ${resume.summary ? `<div style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#1E3A5F;border-bottom:3px solid #F59E0B;padding-bottom:6px;margin-bottom:14px;">Profile</div><p style="font-size:13px;line-height:1.8;color:#444;margin-bottom:24px;">${resume.summary}</p>` : ''}
    ${resume.experience?.length ? `
      <div style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#1E3A5F;border-bottom:3px solid #F59E0B;padding-bottom:6px;margin-bottom:16px;">Experience</div>
      ${resume.experience.map(exp => `
        <div style="margin-bottom:18px;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;">
            <span style="font-weight:700;font-size:16px;color:#1E3A5F;">${exp.title || ''}</span>
            <span style="font-size:12px;color:#888;background:#F3F4F6;padding:2px 10px;border-radius:4px;">${exp.duration || ''}</span>
          </div>
          <div style="font-size:13px;color:#F59E0B;font-weight:600;margin-bottom:8px;">${exp.company || ''}</div>
          ${exp.bullets?.map(b => `<div style="font-size:13px;color:#555;line-height:1.7;padding-left:14px;border-left:2px solid #F59E0B;margin-bottom:4px;">${b}</div>`).join('') || ''}
        </div>`).join('')}` : ''}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:16px;">
      ${resume.education?.length ? `<div><div style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#1E3A5F;border-bottom:3px solid #F59E0B;padding-bottom:6px;margin-bottom:14px;">Education</div>${resume.education.map(edu => `<div style="margin-bottom:12px;"><div style="font-weight:700;font-size:14px;">${edu.degree || ''}</div><div style="font-size:13px;color:#666;">${edu.school || ''}</div><div style="font-size:12px;color:#999;">${edu.year || ''}</div></div>`).join('')}</div>` : ''}
      ${resume.skills?.length ? `<div><div style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#1E3A5F;border-bottom:3px solid #F59E0B;padding-bottom:6px;margin-bottom:14px;">Skills</div><div style="display:flex;flex-wrap:wrap;gap:8px;">${resume.skills.map(s => `<span style="background:#1E3A5F;color:#fff;padding:4px 10px;border-radius:4px;font-size:12px;">${s}</span>`).join('')}</div></div>` : ''}
    </div>
  </div>
</div>`;

const professionalHTML = (resume, photo) => `
<div style="font-family:Inter,sans-serif;background:#fff;min-height:1123px;">
  <div style="background:#B91C1C;padding:36px 48px;display:flex;align-items:center;gap:24px;">
    ${photo ? `<img src="${photo}" style="width:95px;height:95px;border-radius:6px;object-fit:cover;border:2px solid rgba(255,255,255,0.5);flex-shrink:0;" />` : ''}
    <div style="flex:1;">
      ${resume.name ? `<h1 style="font-size:28px;font-weight:700;color:#fff;margin:0 0 8px;">${resume.name}</h1>` : ''}
      <div style="display:flex;flex-wrap:wrap;gap:16px;font-size:12px;color:rgba(255,255,255,0.85);">
        ${resume.email ? `<span>✉ ${resume.email}</span>` : ''}
        ${resume.phone ? `<span>📞 ${resume.phone}</span>` : ''}
        ${resume.location ? `<span>📍 ${resume.location}</span>` : ''}
        ${resume.linkedin ? `<span>🔗 ${resume.linkedin}</span>` : ''}
      </div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:2fr 1fr;">
    <div style="padding:32px 36px;border-right:1px solid #f0f0f0;">
      ${resume.summary ? `<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#B91C1C;margin-bottom:10px;">Professional Summary</div><p style="font-size:13px;line-height:1.8;color:#444;margin-bottom:24px;">${resume.summary}</p>` : ''}
      ${resume.experience?.length ? `
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#B91C1C;margin-bottom:14px;">Work Experience</div>
        ${resume.experience.map(exp => `
          <div style="margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid #f5f5f5;">
            <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
              <span style="font-weight:700;font-size:15px;">${exp.title || ''}</span>
              <span style="font-size:12px;color:#B91C1C;font-weight:600;">${exp.duration || ''}</span>
            </div>
            <div style="font-size:13px;color:#666;margin-bottom:8px;">${exp.company || ''}</div>
            ${exp.bullets?.map(b => `<div style="font-size:13px;color:#555;line-height:1.7;padding-left:12px;margin-bottom:3px;">• ${b}</div>`).join('') || ''}
          </div>`).join('')}` : ''}
    </div>
    <div style="padding:32px 24px;background:#FEF2F2;">
      ${resume.skills?.length ? `<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#B91C1C;margin-bottom:12px;">Skills</div>${resume.skills.map(s => `<div style="font-size:13px;color:#333;padding:6px 0;border-bottom:1px solid #fecaca;">${s}</div>`).join('')}` : ''}
      ${resume.education?.length ? `<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#B91C1C;margin:20px 0 12px;">Education</div>${resume.education.map(edu => `<div style="margin-bottom:14px;"><div style="font-weight:700;font-size:13px;">${edu.degree || ''}</div><div style="font-size:12px;color:#666;">${edu.school || ''}</div><div style="font-size:12px;color:#B91C1C;">${edu.year || ''}</div></div>`).join('')}` : ''}
    </div>
  </div>
</div>`;


const executiveHTML = (resume, photo) => `
<div style="font-family:Inter,sans-serif;background:#fff;min-height:1123px;box-sizing:border-box;">
  <div style="background:#064E3B;color:#fff;padding:40px 48px;display:flex;align-items:center;gap:24px;">
    ${photo ? `<img src="${photo}" style="width:100px;height:100px;border-radius:8px;object-fit:cover;border:3px solid rgba(255,255,255,0.3);flex-shrink:0;" />` : ''}
    <div style="flex:1;">
      ${resume.name ? `<h1 style="font-size:30px;font-weight:700;margin:0 0 8px;">${resume.name}</h1>` : ''}
      <div style="display:flex;flex-wrap:wrap;gap:16px;font-size:12px;opacity:0.85;">
        ${resume.email ? `<span>✉ ${resume.email}</span>` : ''}${resume.phone ? `<span>📞 ${resume.phone}</span>` : ''}${resume.location ? `<span>📍 ${resume.location}</span>` : ''}${resume.linkedin ? `<span>🔗 ${resume.linkedin}</span>` : ''}
      </div>
    </div>
  </div>
  <div style="display:flex;">
    <div style="flex:2;padding:32px 36px;border-right:1px solid #e5e7eb;">
      ${resume.summary ? `<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#064E3B;margin-bottom:10px;">Executive Summary</div><p style="font-size:13px;line-height:1.8;color:#444;margin-bottom:24px;">${resume.summary}</p>` : ''}
      ${resume.experience?.length ? `<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#064E3B;margin-bottom:14px;">Professional Experience</div>${resume.experience.map(exp => `<div style="margin-bottom:18px;padding-left:14px;border-left:3px solid #10b981;"><div style="font-weight:700;font-size:15px;">${exp.title||''}</div><div style="font-size:12px;color:#064E3B;font-weight:600;margin-bottom:6px;">${exp.company||''} · ${exp.duration||''}</div>${exp.bullets?.map(b=>`<div style="font-size:13px;color:#555;line-height:1.7;margin-bottom:3px;">• ${b}</div>`).join('')||''}</div>`).join('')}` : ''}
    </div>
    <div style="flex:1;padding:32px 24px;background:#F0FDF4;">
      ${resume.skills?.length ? `<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#064E3B;margin-bottom:12px;">Core Skills</div>${resume.skills.map(s=>`<div style="font-size:13px;color:#333;padding:6px 0;border-bottom:1px solid #bbf7d0;">${s}</div>`).join('')}` : ''}
      ${resume.education?.length ? `<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#064E3B;margin:20px 0 12px;">Education</div>${resume.education.map(edu=>`<div style="margin-bottom:12px;"><div style="font-weight:700;font-size:13px;">${edu.degree||''}</div><div style="font-size:12px;color:#666;">${edu.school||''}</div><div style="font-size:12px;color:#064E3B;">${edu.year||''}</div></div>`).join('')}` : ''}
    </div>
  </div>
</div>`;

const creativeHTML = (resume, photo) => `
<div style="font-family:Inter,sans-serif;background:#fff;min-height:1123px;box-sizing:border-box;">
  <div style="background:linear-gradient(135deg,#9D174D,#DB2777);color:#fff;padding:48px 48px 32px;">
    <div style="display:flex;align-items:center;gap:24px;">
      ${photo ? `<img src="${photo}" style="width:100px;height:100px;border-radius:50%;object-fit:cover;border:4px solid rgba(255,255,255,0.4);flex-shrink:0;" />` : ''}
      <div>
        ${resume.name ? `<h1 style="font-size:32px;font-weight:800;margin:0 0 8px;">${resume.name}</h1>` : ''}
        <div style="display:flex;flex-wrap:wrap;gap:14px;font-size:12px;opacity:0.9;">
          ${resume.email ? `<span>✉ ${resume.email}</span>` : ''}${resume.phone ? `<span>📞 ${resume.phone}</span>` : ''}${resume.location ? `<span>📍 ${resume.location}</span>` : ''}
        </div>
      </div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;">
    <div style="padding:32px 36px;border-right:1px solid #fce7f3;">
      ${resume.summary ? `<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9D174D;margin-bottom:10px;">About Me</div><p style="font-size:13px;line-height:1.8;color:#444;margin-bottom:24px;">${resume.summary}</p>` : ''}
      ${resume.experience?.length ? `<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9D174D;margin-bottom:14px;">Experience</div>${resume.experience.map(exp=>`<div style="margin-bottom:18px;"><div style="font-weight:700;font-size:14px;color:#1a1a1a;">${exp.title||''}</div><div style="font-size:12px;color:#9D174D;margin-bottom:6px;font-weight:600;">${exp.company||''} · ${exp.duration||''}</div>${exp.bullets?.map(b=>`<div style="font-size:12px;color:#555;line-height:1.7;padding-left:10px;border-left:2px solid #fbcfe8;margin-bottom:3px;">${b}</div>`).join('')||''}</div>`).join('')}` : ''}
    </div>
    <div style="padding:32px 32px;background:#FDF2F8;">
      ${resume.skills?.length ? `<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9D174D;margin-bottom:12px;">Skills</div><div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px;">${resume.skills.map(s=>`<span style="background:#9D174D;color:#fff;padding:4px 12px;border-radius:20px;font-size:12px;">${s}</span>`).join('')}</div>` : ''}
      ${resume.education?.length ? `<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9D174D;margin-bottom:12px;">Education</div>${resume.education.map(edu=>`<div style="margin-bottom:14px;padding:12px;background:#fff;border-radius:8px;border:1px solid #fbcfe8;"><div style="font-weight:700;font-size:13px;">${edu.degree||''}</div><div style="font-size:12px;color:#666;">${edu.school||''}</div><div style="font-size:12px;color:#9D174D;">${edu.year||''}</div></div>`).join('')}` : ''}
    </div>
  </div>
</div>`;

const techHTML = (resume, photo) => `
<div style="font-family:Courier New,monospace;background:#0f172a;min-height:1123px;color:#e2e8f0;box-sizing:border-box;">
  <div style="padding:40px 48px;border-bottom:1px solid #1e293b;">
    <div style="display:flex;align-items:center;gap:24px;">
      ${photo ? `<img src="${photo}" style="width:90px;height:90px;border-radius:8px;object-fit:cover;border:2px solid #38bdf8;flex-shrink:0;" />` : ''}
      <div style="flex:1;">
        <div style="color:#38bdf8;font-size:13px;margin-bottom:4px;">// developer profile</div>
        ${resume.name ? `<h1 style="font-size:30px;font-weight:700;margin:0 0 8px;color:#f1f5f9;">${resume.name}</h1>` : ''}
        <div style="display:flex;flex-wrap:wrap;gap:16px;font-size:12px;color:#94a3b8;">
          ${resume.email ? `<span>✉ ${resume.email}</span>` : ''}${resume.phone ? `<span>📞 ${resume.phone}</span>` : ''}${resume.linkedin ? `<span>🔗 ${resume.linkedin}</span>` : ''}
        </div>
      </div>
    </div>
  </div>
  <div style="display:flex;">
    <div style="flex:2;padding:32px 36px;">
      ${resume.summary ? `<div style="color:#38bdf8;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">/* about */</div><p style="font-size:13px;line-height:1.8;color:#94a3b8;margin-bottom:24px;font-family:Inter,sans-serif;">${resume.summary}</p>` : ''}
      ${resume.experience?.length ? `<div style="color:#38bdf8;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-bottom:14px;">/* experience */</div>${resume.experience.map(exp=>`<div style="margin-bottom:18px;padding:14px;background:#1e293b;border-radius:6px;border-left:3px solid #38bdf8;"><div style="font-weight:700;font-size:14px;color:#f1f5f9;margin-bottom:4px;">${exp.title||''}</div><div style="font-size:12px;color:#38bdf8;margin-bottom:8px;">${exp.company||''} · ${exp.duration||''}</div>${exp.bullets?.map(b=>`<div style="font-size:12px;color:#94a3b8;line-height:1.7;margin-bottom:3px;font-family:Inter,sans-serif;">→ ${b}</div>`).join('')||''}</div>`).join('')}` : ''}
    </div>
    <div style="flex:1;padding:32px 24px;border-left:1px solid #1e293b;">
      ${resume.skills?.length ? `<div style="color:#38bdf8;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;">/* skills */</div>${resume.skills.map(s=>`<div style="font-size:12px;color:#e2e8f0;padding:6px 10px;background:#1e293b;border-radius:4px;margin-bottom:6px;font-family:Inter,sans-serif;">▸ ${s}</div>`).join('')}` : ''}
      ${resume.education?.length ? `<div style="color:#38bdf8;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:20px 0 12px;">/* education */</div>${resume.education.map(edu=>`<div style="margin-bottom:12px;padding:10px;background:#1e293b;border-radius:4px;"><div style="font-weight:700;font-size:12px;color:#f1f5f9;font-family:Inter,sans-serif;">${edu.degree||''}</div><div style="font-size:11px;color:#94a3b8;font-family:Inter,sans-serif;">${edu.school||''}</div><div style="font-size:11px;color:#38bdf8;font-family:Inter,sans-serif;">${edu.year||''}</div></div>`).join('')}` : ''}
    </div>
  </div>
</div>`;

const elegantHTML = (resume, photo) => `
<div style="font-family:Georgia,serif;background:#FFFBEB;min-height:1123px;padding:60px 64px;box-sizing:border-box;">
  <div style="text-align:center;border-bottom:2px solid #78350F;padding-bottom:24px;margin-bottom:28px;">
    ${photo ? `<img src="${photo}" style="width:100px;height:100px;border-radius:50%;object-fit:cover;border:3px solid #d97706;margin-bottom:16px;" />` : ''}
    ${resume.name ? `<h1 style="font-size:34px;font-weight:700;color:#78350F;margin:0 0 8px;letter-spacing:2px;">${resume.name}</h1>` : ''}
    <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:16px;font-size:12px;color:#92400e;">
      ${resume.email ? `<span>✉ ${resume.email}</span>` : ''}${resume.phone ? `<span>📞 ${resume.phone}</span>` : ''}${resume.location ? `<span>📍 ${resume.location}</span>` : ''}
    </div>
  </div>
  ${resume.summary ? `<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:#78350F;text-align:center;margin-bottom:10px;">Profile</div><p style="font-size:13px;line-height:1.9;color:#555;margin-bottom:24px;text-align:center;font-style:italic;">${resume.summary}</p><div style="height:1px;background:#d97706;margin-bottom:24px;"></div>` : ''}
  ${resume.experience?.length ? `<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:#78350F;margin-bottom:16px;">Experience</div>${resume.experience.map(exp=>`<div style="margin-bottom:18px;"><div style="display:flex;justify-content:space-between;align-items:baseline;"><span style="font-weight:700;font-size:15px;color:#78350F;">${exp.title||''}</span><span style="font-size:12px;color:#92400e;">${exp.duration||''}</span></div><div style="font-size:13px;color:#d97706;font-style:italic;margin-bottom:6px;">${exp.company||''}</div>${exp.bullets?.map(b=>`<div style="font-size:13px;color:#555;line-height:1.7;padding-left:14px;border-left:2px solid #d97706;margin-bottom:3px;">${b}</div>`).join('')||''}</div>`).join('')}<div style="height:1px;background:#d97706;margin:16px 0;"></div>` : ''}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;">
    ${resume.education?.length ? `<div><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:#78350F;margin-bottom:14px;">Education</div>${resume.education.map(edu=>`<div style="margin-bottom:12px;"><div style="font-weight:700;font-size:14px;color:#78350F;">${edu.degree||''}</div><div style="font-size:13px;color:#666;font-style:italic;">${edu.school||''}</div><div style="font-size:12px;color:#92400e;">${edu.year||''}</div></div>`).join('')}</div>` : ''}
    ${resume.skills?.length ? `<div><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:#78350F;margin-bottom:14px;">Skills</div><div style="display:flex;flex-wrap:wrap;gap:8px;">${resume.skills.map(s=>`<span style="background:#78350F;color:#FFFBEB;padding:4px 12px;border-radius:20px;font-size:12px;">${s}</span>`).join('')}</div></div>` : ''}
  </div>
</div>`;

const freshHTML = (resume, photo) => `
<div style="font-family:Inter,sans-serif;background:#fff;min-height:1123px;box-sizing:border-box;">
  <div style="background:#1D4ED8;padding:36px 48px;display:flex;align-items:center;gap:24px;">
    ${photo ? `<img src="${photo}" style="width:95px;height:95px;border-radius:12px;object-fit:cover;border:3px solid rgba(255,255,255,0.4);flex-shrink:0;" />` : ''}
    <div style="flex:1;">
      ${resume.name ? `<h1 style="font-size:28px;font-weight:700;color:#fff;margin:0 0 8px;">${resume.name}</h1>` : ''}
      <div style="display:flex;flex-wrap:wrap;gap:16px;font-size:12px;color:rgba(255,255,255,0.85);">
        ${resume.email ? `<span>✉ ${resume.email}</span>` : ''}${resume.phone ? `<span>📞 ${resume.phone}</span>` : ''}${resume.location ? `<span>📍 ${resume.location}</span>` : ''}${resume.linkedin ? `<span>🔗 ${resume.linkedin}</span>` : ''}
      </div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:2fr 1fr;">
    <div style="padding:32px 36px;">
      ${resume.summary ? `<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#1D4ED8;margin-bottom:10px;">About</div><p style="font-size:13px;line-height:1.8;color:#444;margin-bottom:24px;">${resume.summary}</p>` : ''}
      ${resume.experience?.length ? `<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#1D4ED8;margin-bottom:14px;">Experience</div>${resume.experience.map(exp=>`<div style="margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid #eff6ff;"><div style="display:flex;justify-content:space-between;margin-bottom:3px;"><span style="font-weight:700;font-size:15px;">${exp.title||''}</span><span style="font-size:12px;color:#1D4ED8;background:#eff6ff;padding:2px 10px;border-radius:20px;font-weight:600;">${exp.duration||''}</span></div><div style="font-size:13px;color:#60a5fa;margin-bottom:8px;font-weight:600;">${exp.company||''}</div>${exp.bullets?.map(b=>`<div style="font-size:13px;color:#555;line-height:1.7;margin-bottom:3px;">• ${b}</div>`).join('')||''}</div>`).join('')}` : ''}
    </div>
    <div style="padding:32px 24px;background:#EFF6FF;border-left:1px solid #dbeafe;">
      ${resume.skills?.length ? `<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#1D4ED8;margin-bottom:12px;">Skills</div>${resume.skills.map(s=>`<div style="font-size:13px;color:#1e40af;padding:6px 10px;background:#fff;border-radius:6px;margin-bottom:6px;border:1px solid #bfdbfe;">${s}</div>`).join('')}` : ''}
      ${resume.education?.length ? `<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#1D4ED8;margin:20px 0 12px;">Education</div>${resume.education.map(edu=>`<div style="margin-bottom:14px;padding:12px;background:#fff;border-radius:8px;border:1px solid #bfdbfe;"><div style="font-weight:700;font-size:13px;">${edu.degree||''}</div><div style="font-size:12px;color:#666;">${edu.school||''}</div><div style="font-size:12px;color:#1D4ED8;">${edu.year||''}</div></div>`).join('')}` : ''}
    </div>
  </div>
</div>`;



const blueSideHTML = (resume, photo) => `
<div style="display:flex;font-family:Georgia,serif;min-height:1123px;width:794px;background:#fff;box-sizing:border-box;">
  <div style="width:260px;background:#dce6f0;flex-shrink:0;padding:0;">
    <div style="position:relative;padding:40px 24px 24px;margin-bottom:16px;">
      <div style="border:2px solid #a0b4c8;width:80px;height:80px;position:absolute;top:28px;left:16px;"></div>
      ${photo ? `<img src="${photo}" style="width:120px;height:140px;object-fit:cover;position:relative;z-index:1;margin-left:20px;margin-top:12px;display:block;" />` : '<div style="width:120px;height:140px;background:#b0c4d8;margin-left:20px;margin-top:12px;"></div>'}
    </div>
    <div style="padding:16px 24px;border-top:1px solid #a0b4c8;margin-bottom:8px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1a2a3a;margin-bottom:10px;font-family:Inter,sans-serif;">Contact</div>
      ${resume.location ? `<div style="font-size:11px;color:#333;line-height:1.6;margin-bottom:4px;">${resume.location}</div>` : ''}
      ${resume.phone ? `<div style="font-size:11px;color:#333;line-height:1.6;margin-bottom:4px;">${resume.phone}</div>` : ''}
      ${resume.email ? `<div style="font-size:11px;color:#333;line-height:1.6;margin-bottom:4px;">${resume.email}</div>` : ''}
    </div>
    ${resume.skills?.length ? `<div style="padding:16px 24px;border-top:1px solid #a0b4c8;"><div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1a2a3a;margin-bottom:10px;font-family:Inter,sans-serif;">Skills</div>${resume.skills.map(s=>`<div style="font-size:11px;color:#444;line-height:1.7;">• ${s}</div>`).join('')}</div>` : ''}
    ${resume.summary ? `<div style="padding:16px 24px;border-top:1px solid #a0b4c8;"><div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1a2a3a;margin-bottom:10px;font-family:Inter,sans-serif;">Profile</div><p style="font-size:11px;color:#444;line-height:1.7;margin:0;">${resume.summary}</p></div>` : ''}
  </div>
  <div style="flex:1;padding:48px 40px;box-sizing:border-box;">
    ${resume.name ? `<div style="font-size:36px;font-weight:700;letter-spacing:6px;text-transform:uppercase;color:#1a2a3a;line-height:1.1;">${resume.name.split(' ')[0]}</div><div style="font-size:36px;font-weight:400;letter-spacing:6px;text-transform:uppercase;color:#4a6a8a;line-height:1.1;margin-bottom:4px;">${resume.name.split(' ').slice(1).join(' ')}</div>` : ''}
    <div style="height:2px;background:#4a6a8a;margin:12px 0;"></div>
    ${resume.education?.length ? `<div style="font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1a2a3a;margin-bottom:12px;font-family:Inter,sans-serif;">Education</div>${resume.education.map(edu=>`<div style="margin-bottom:10px;"><div style="font-size:13px;color:#333;">${edu.school||''}</div><div style="font-size:13px;font-weight:600;color:#1a2a3a;">${edu.degree||''}</div><div style="font-size:12px;color:#666;">${edu.year||''}</div></div>`).join('')}<div style="height:1px;background:#ccc;margin-top:16px;margin-bottom:16px;"></div>` : ''}
    ${resume.experience?.length ? `<div style="font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1a2a3a;margin-bottom:12px;font-family:Inter,sans-serif;">Experience</div>${resume.experience.map(exp=>`<div style="margin-bottom:14px;"><div style="font-size:12px;color:#666;margin-bottom:3px;">${exp.duration||''}</div><div style="font-size:13px;font-weight:600;color:#1a2a3a;margin-bottom:4px;">${exp.title||''}${exp.company?` | ${exp.company}`:''}</div>${exp.bullets?.map(b=>`<div style="font-size:12px;color:#444;line-height:1.7;">${b}</div>`).join('')||''}</div>`).join('')}` : ''}
  </div>
</div>`;

const creamHTML = (resume, photo) => `
<div style="font-family:Inter,sans-serif;background:#faf8f0;min-height:1123px;width:794px;padding:48px 44px;box-sizing:border-box;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
    <div>
      ${resume.name ? `<div style="font-size:40px;font-weight:700;color:#8B2500;letter-spacing:4px;text-transform:uppercase;line-height:1.1;">${resume.name.split(' ')[0]}</div><div style="font-size:40px;font-weight:400;color:#8B2500;letter-spacing:4px;text-transform:uppercase;line-height:1.1;margin-bottom:8px;">${resume.name.split(' ').slice(1).join(' ')}</div>` : ''}
    </div>
    ${photo ? `<img src="${photo}" style="width:100px;height:100px;border-radius:50%;object-fit:cover;border:2px solid #d4956a;" />` : ''}
  </div>
  <div style="height:2px;background:#c0633a;margin:16px 0;"></div>
  <div style="display:grid;grid-template-columns:180px 1fr 1fr;gap:16px;margin-bottom:8px;">
    <div><div style="font-size:12px;font-weight:700;color:#8B2500;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">Contact Info</div></div>
    <div style="font-size:12px;color:#333;line-height:1.7;">${resume.location?`<div>${resume.location}</div>`:''}${resume.phone?`<div>${resume.phone}</div>`:''}</div>
    <div style="font-size:12px;color:#333;line-height:1.7;">${resume.email?`<div>${resume.email}</div>`:''}${resume.linkedin?`<div>${resume.linkedin}</div>`:''}</div>
  </div>
  <div style="height:2px;background:#c0633a;margin:8px 0 20px;"></div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-bottom:24px;">
    <div>
      <div style="font-size:12px;font-weight:700;color:#8B2500;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;">Education</div>
      ${resume.education?.map(edu=>`<div style="margin-bottom:8px;"><div style="font-size:12px;font-weight:700;color:#1a1a1a;">${edu.school||''}</div><div style="font-size:12px;font-weight:700;color:#1a1a1a;">${edu.degree||''}</div><div style="font-size:11px;color:#555;">${edu.year||''}</div></div>`).join('')||''}
    </div>
    <div>
      <div style="font-size:12px;font-weight:700;color:#8B2500;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;">Summary</div>
      ${resume.summary?`<p style="font-size:12px;color:#444;line-height:1.7;margin:0;">${resume.summary}</p>`:''}
    </div>
    <div>
      <div style="font-size:12px;font-weight:700;color:#8B2500;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;">Skills</div>
      ${resume.skills?.map(s=>`<div style="font-size:12px;color:#444;line-height:1.7;">${s}</div>`).join('')||''}
    </div>
  </div>
  <div style="height:2px;background:#c0633a;margin:0 0 20px;"></div>
  ${resume.experience?.length ? `<div style="font-size:12px;font-weight:700;color:#8B2500;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:14px;">Experience</div>${resume.experience.map(exp=>`<div style="margin-bottom:16px;"><div style="font-size:13px;font-weight:700;color:#1a1a1a;margin-bottom:2px;">${exp.duration||''}</div><div style="font-size:13px;color:#333;margin-bottom:4px;">${exp.title||''}${exp.company?` | ${exp.company}`:''}</div>${exp.bullets?.map(b=>`<div style="font-size:12px;color:#555;line-height:1.7;">${b}</div>`).join('')||''}</div>`).join('')}` : ''}
</div>`;

const mauveHTML = (resume, photo) => `
<div style="font-family:Inter,sans-serif;background:#f5ede8;min-height:1123px;width:794px;box-sizing:border-box;">
  <div style="background:#f5ede8;padding:40px 40px 20px;border-bottom:4px solid #8B6B6B;position:relative;">
    ${resume.name ? `<h1 style="font-size:32px;font-weight:800;color:#5C3D3D;margin:0 0 4px;">${resume.name}</h1>` : ''}
    ${resume.experience?.[0]?.title ? `<div style="font-size:14px;color:#8B6B6B;letter-spacing:2px;text-transform:uppercase;">${resume.experience[0].title}</div>` : ''}
    ${photo ? `<img src="${photo}" style="position:absolute;top:32px;right:40px;width:80px;height:80px;border-radius:4px;object-fit:cover;" />` : ''}
  </div>
  <div style="height:6px;background:#8B6B6B;"></div>
  <div style="display:grid;grid-template-columns:1fr 240px;min-height:900px;">
    <div style="padding:28px 32px;border-right:1px solid #d4b8b0;">
      ${resume.education?.length ? `<div style="font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#5C3D3D;margin-bottom:12px;border-bottom:1px solid #d4b8b0;padding-bottom:6px;">Education</div>${resume.education.map(edu=>`<div style="margin-bottom:12px;"><div style="font-size:13px;font-weight:700;color:#1a1a1a;">${edu.school||''}</div><div style="font-size:12px;color:#555;">${edu.degree||''} ${edu.year?`| ${edu.year}`:''}</div></div>`).join('')}<div style="margin-bottom:24px;"></div>` : ''}
      ${resume.experience?.length ? `<div style="font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#5C3D3D;margin-bottom:12px;border-bottom:1px solid #d4b8b0;padding-bottom:6px;">Professional Experience</div>${resume.experience.map(exp=>`<div style="margin-bottom:16px;"><div style="font-size:13px;font-weight:700;color:#1a1a1a;">${exp.title||''}${exp.company?` | ${exp.company}`:''}</div><div style="font-size:12px;color:#8B6B6B;margin-bottom:4px;">${exp.duration||''}</div>${exp.bullets?.map(b=>`<div style="font-size:12px;color:#555;line-height:1.7;margin-bottom:2px;">${b}</div>`).join('')||''}</div>`).join('')}` : ''}
    </div>
    <div style="padding:28px 24px;background:#ede0d8;">
      <div style="font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#5C3D3D;margin-bottom:10px;border-bottom:1px solid #c4a89a;padding-bottom:4px;">Contact Info</div>
      ${resume.location?`<div style="font-size:11px;color:#444;line-height:1.7;">${resume.location}</div>`:''}
      ${resume.phone?`<div style="font-size:11px;color:#444;line-height:1.7;">${resume.phone}</div>`:''}
      ${resume.email?`<div style="font-size:11px;color:#444;line-height:1.7;margin-bottom:16px;">${resume.email}</div>`:''}
      ${resume.skills?.length ? `<div style="font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#5C3D3D;margin-bottom:10px;border-bottom:1px solid #c4a89a;padding-bottom:4px;">Skills & Abilities</div>${resume.skills.map(s=>`<div style="font-size:11px;color:#444;line-height:1.8;">${s}</div>`).join('')}<div style="margin-bottom:16px;"></div>` : ''}
      ${resume.summary ? `<div style="font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#5C3D3D;margin-bottom:10px;border-bottom:1px solid #c4a89a;padding-bottom:4px;">Summary</div><p style="font-size:11px;color:#444;line-height:1.8;margin:0;">${resume.summary}</p>` : ''}
    </div>
  </div>
</div>`;


const getTemplateHTML = (resume, templateId, photo) => {
  switch (parseInt(templateId)) {
    case 2: return modernHTML(resume, photo);
    case 3: return minimalHTML(resume, photo);
    case 4: return boldHTML(resume, photo);
    case 5: return professionalHTML(resume, photo);
    case 6: return executiveHTML(resume, photo);
    case 7: return creativeHTML(resume, photo);
    case 8: return techHTML(resume, photo);
    case 9: return elegantHTML(resume, photo);
    case 10: return freshHTML(resume, photo);
    case 11: return blueSideHTML(resume, photo);
    case 12: return creamHTML(resume, photo);
    case 13: return mauveHTML(resume, photo);
    default: return classicHTML(resume, photo);
  }
};

router.post('/generate', async (req, res) => {
  const { resume, templateId, photo } = req.body;

  if (!resume) return res.status(400).json({ error: 'resume data is required' });

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap" rel="stylesheet">
    <style>* { margin: 0; padding: 0; box-sizing: border-box; } body { width: 794px; }</style>
    </head><body>${getTemplateHTML(resume, templateId || 1, photo)}</body></html>`;

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      width: '794px',
      height: '1123px',
      printBackground: true,
      margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' },
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${(resume.name || 'resume').replace(/\s+/g, '_')}_resume.pdf"`,
      'Content-Length': pdf.length,
    });

    res.send(pdf);
  } catch (err) {
    console.error('PDF generation error:', err.message);
    res.status(500).json({ error: 'Failed to generate PDF' });
  } finally {
    if (browser) await browser.close();
  }
});

module.exports = router;
