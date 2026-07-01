// Dev-only: build a minimal valid .pptx with a few text slides for smoke tests.
const JSZip = require("jszip");
const fs = require("fs");

const SLIDES = [
  { title: "季度业务汇报", body: ["2024 年第一季度", "增长与展望"] },
  {
    title: "本季度亮点",
    body: [
      "营收同比增长 32%",
      "新增企业客户 148 家",
      "净推荐值提升至 61",
      "华东区首次实现盈利",
      "产品上线三大新模块",
      "团队规模扩张至 90 人",
    ],
  },
  { title: "增长路线图", body: ["Q1 打基础", "Q2 扩规模", "Q3 提效率", "Q4 冲目标"] },
  { title: "产品对比：旧版 vs 新版", body: ["加载速度", "交互能力", "分享方式"] },
  { title: "下一步计划", body: ["深化客户成功", "拓展海外市场"] },
];

function textShape(title, texts) {
  const paras = [title, ...texts]
    .map(
      (t) =>
        `<a:p><a:r><a:t>${t.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</a:t></a:r></a:p>`
    )
    .join("");
  return `<p:sp><p:txBody><a:bodyPr/><a:p/>${paras}</p:txBody></p:sp>`;
}

function slideXml(title, texts) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:cSld><p:spTree>${textShape(title, texts)}</p:spTree></p:cSld></p:sld>`;
}

async function main() {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="xml" ContentType="application/xml"/>
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
</Types>`
  );
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`
  );
  zip.file("ppt/presentation.xml", `<?xml version="1.0"?><p:presentation/>`);
  SLIDES.forEach((s, i) => {
    zip.file(`ppt/slides/slide${i + 1}.xml`, slideXml(s.title, s.body));
  });

  const buf = await zip.generateAsync({ type: "nodebuffer" });
  fs.writeFileSync("sample.pptx", buf);
  console.log(`Wrote sample.pptx (${buf.length} bytes, ${SLIDES.length} slides)`);
}

main();
