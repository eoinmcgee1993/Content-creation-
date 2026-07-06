const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const OUT_DIR = path.join(__dirname, '..', 'dist');
const OUT_FILE = path.join(OUT_DIR, 'LEXIS_OS_Emagazine_Q3_2026.pdf');

const COLORS = {
  navy: '#0B1E3D',
  teal: '#1FB6A6',
  ink: '#1A1A1A',
  gray: '#5B6470',
  paper: '#FFFFFF',
  cream: '#F4F1EA',
};

const PAGE = { size: 'A4', margins: { top: 56, bottom: 20, left: 56, right: 56 }, bufferPages: true };

const articles = [
  {
    kicker: 'Release Notes',
    title: 'State of LEXIS OS: Q3 2026',
    dek: 'What shipped this quarter, what broke, and what we learned rolling it back.',
    body: [
      'LEXIS OS crossed 40,000 active engineering workspaces this quarter, and the team spent most of that growth budget on reliability rather than features. The headline change is a deterministic replay layer: every agent run now records its full tool-call trace, so a production failure can be re-executed locally with identical inputs.',
      'The second change is scoped credentials. Agents used to inherit one workspace-wide token; they now request narrow, time-boxed grants per tool call, logged and revocable individually. Not everything landed cleanly, a scheduler rollout caused a week of delayed cron jobs before we traced it to a timezone bug in the priority queue, and we are publishing that postmortem alongside this issue.',
    ],
    pull: '"Deterministic replay turned our worst on-call week into a one-hour debugging session." — Platform SRE lead',
  },
  {
    kicker: 'Engineering',
    title: 'Building Reliable Agent Pipelines from Scratch',
    dek: 'Three habits that separate agents that work in the demo from agents that work in production.',
    body: [
      'The gap between a working demo and a production agent pipeline is rarely about model quality. It is almost always about what happens at the seams: retries, partial failures, and state that outlives a single request. Teams that get this right share three habits.',
      'First, they make every tool call idempotent before letting the agent retry it automatically, an agent that double-charges a customer on a retry is a systems bug, not a modeling one. Second, they separate planning from execution as distinct, inspectable steps, so a bad outcome can be diffed against the plan instead of guessed at. Third, they put a hard timeout on every external call, because a pipeline that can hang indefinitely will eventually do exactly that.',
    ],
    pull: '"An agent that can double-charge a customer is a systems problem, not a modeling problem."',
  },
  {
    kicker: 'Deep Dive',
    title: 'Inside the Vector Memory Engine',
    dek: 'How LEXIS OS keeps long-running agents from forgetting what matters, without keeping everything.',
    body: [
      'Long-running agents accumulate context faster than any window can hold it, so the practical question is never "how do we remember everything" but "how do we forget the right things." The memory engine behind LEXIS OS uses a two-tier design: a small working set of recent turns, and a larger store of embeddings queried only when that working set runs dry.',
      'The interesting engineering is in eviction. Naive recency-based eviction throws away stable, load-bearing facts, an account ID, a prior decision, that recur across a session without repeating often enough to stay near the top of a recency-sorted list. The fix scores memories on recency, retrieval frequency, and a cheap "fact versus passing remark" heuristic, and evicts on that composite instead. It is closer to cache design than machine learning, and that is the point.',
    ],
    pull: null,
  },
  {
    kicker: 'Case Study',
    title: 'Cutting Inference Costs 40% Without Touching the Model',
    dek: 'A mid-market customer walks through the changes that moved the needle, in order of effort.',
    body: [
      'When a LEXIS OS customer in logistics came to us with a ballooning inference bill, the instinct was to reach for a smaller model. We asked them to look at the request pattern first, and found over half their agent calls were re-deriving the same result inside a session, because each tool call re-sent the full conversation history instead of a summary.',
      'A response cache keyed on the tool inputs cut redundant calls by roughly a quarter with no other changes. Replacing full-history prompts with a rolling summary plus the last few turns cut token volume further with no drop in task success. Only then did model selection become the right lever, routing the routine 80% of calls to a cheaper model closed the rest of the gap.',
    ],
    pull: '"Fix the request pattern before you touch the model — most of the waste is upstream of any single call."',
  },
];

function drawCover(doc) {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.navy);

  doc.rect(0, doc.page.height - 14, doc.page.width, 14).fill(COLORS.teal);

  doc
    .fillColor(COLORS.teal)
    .font('Helvetica-Bold')
    .fontSize(14)
    .text('THE QUARTERLY EMAGAZINE', 56, 90, { characterSpacing: 2 });

  doc
    .fillColor(COLORS.paper)
    .font('Helvetica-Bold')
    .fontSize(64)
    .text('LEXIS OS', 54, 130, { width: doc.page.width - 108 });

  doc
    .fillColor(COLORS.paper)
    .font('Helvetica')
    .fontSize(20)
    .text('AI Engineering, From Scratch', 56, 230, { width: doc.page.width - 112 });

  doc
    .moveTo(56, 280)
    .lineTo(230, 280)
    .lineWidth(2)
    .strokeColor(COLORS.teal)
    .stroke();

  doc
    .fillColor('#AEB8C9')
    .font('Helvetica')
    .fontSize(13)
    .text('Q3 2026 ISSUE', 56, 296);

  const coverLines = [
    'State of LEXIS OS: Q3 2026 release notes',
    'Building reliable agent pipelines from scratch',
    'Inside the vector memory engine',
    'Case study: cutting inference costs 40%',
  ];

  let y = doc.page.height - 220;
  doc.fontSize(13).font('Helvetica-Bold').fillColor(COLORS.teal).text('IN THIS ISSUE', 56, y);
  y += 22;
  coverLines.forEach((line) => {
    doc.fontSize(13).font('Helvetica').fillColor(COLORS.paper).text(`—  ${line}`, 56, y, {
      width: doc.page.width - 112,
    });
    y += 22;
  });
}

function drawTOC(doc) {
  addHeader(doc, 'Contents');
  let y = 150;
  const titleWidth = doc.page.width - 112 - 100;
  articles.forEach((article, i) => {
    doc
      .fillColor(COLORS.teal)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(article.kicker.toUpperCase(), 56, y, { characterSpacing: 1 });
    doc
      .fillColor(COLORS.ink)
      .font('Helvetica-Bold')
      .fontSize(20)
      .text(article.title, 56, y + 16, { width: titleWidth });
    const dekY = doc.y + 6;
    doc
      .fillColor(COLORS.gray)
      .font('Helvetica')
      .fontSize(12)
      .text(article.dek, 56, dekY, { width: doc.page.width - 200 });
    const itemBottom = doc.y;
    doc
      .fillColor(COLORS.gray)
      .font('Helvetica-Bold')
      .fontSize(28)
      .text(String(i + 3).padStart(2, '0'), doc.page.width - 130, y + 8, { width: 60, align: 'right' });
    y = itemBottom + 26;
  });
}

function addHeader(doc, label) {
  doc
    .fillColor(COLORS.gray)
    .font('Helvetica-Bold')
    .fontSize(10)
    .text('LEXIS OS  •  Q3 2026', 56, 50, { characterSpacing: 1 });
  doc
    .moveTo(56, 68)
    .lineTo(doc.page.width - 56, 68)
    .lineWidth(1)
    .strokeColor('#DADFE6')
    .stroke();
  if (label) {
    doc.fillColor(COLORS.navy).font('Helvetica-Bold').fontSize(28).text(label, 56, 90);
  }
}

function addFooter(doc, pageNumber) {
  const y = doc.page.height - 56;
  doc
    .moveTo(56, y)
    .lineTo(doc.page.width - 56, y)
    .lineWidth(0.5)
    .strokeColor('#DADFE6')
    .stroke();
  doc
    .fillColor(COLORS.gray)
    .font('Helvetica')
    .fontSize(9)
    .text('LEXIS OS Emagazine — Q3 2026', 56, y + 10, { lineBreak: false });
  doc
    .fillColor(COLORS.gray)
    .font('Helvetica')
    .fontSize(9)
    .text(String(pageNumber).padStart(2, '0'), doc.page.width - 106, y + 10, {
      width: 50,
      align: 'right',
      lineBreak: false,
    });
}

function drawArticle(doc, article) {
  doc
    .fillColor(COLORS.teal)
    .font('Helvetica-Bold')
    .fontSize(11)
    .text(article.kicker.toUpperCase(), 56, 56, { characterSpacing: 1 });

  doc
    .fillColor(COLORS.navy)
    .font('Helvetica-Bold')
    .fontSize(30)
    .text(article.title, 56, 74, { width: doc.page.width - 112 });

  const dekY = doc.y + 8;
  doc
    .fillColor(COLORS.gray)
    .font('Helvetica-Oblique')
    .fontSize(13)
    .text(article.dek, 56, dekY, { width: doc.page.width - 112 });

  doc
    .moveTo(56, doc.y + 14)
    .lineTo(130, doc.y + 14)
    .lineWidth(2)
    .strokeColor(COLORS.teal)
    .stroke();

  let bodyY = doc.y + 30;
  doc.fillColor(COLORS.ink).font('Helvetica').fontSize(11.5);

  article.body.forEach((paragraph, idx) => {
    doc.text(paragraph, 56, bodyY, {
      width: doc.page.width - 112,
      align: 'justify',
      lineGap: 3,
    });
    bodyY = doc.y + 14;
  });

  if (article.pull) {
    bodyY += 6;
    doc
      .rect(56, bodyY, doc.page.width - 112, 2)
      .fill(COLORS.teal);
    doc
      .fillColor(COLORS.navy)
      .font('Helvetica-BoldOblique')
      .fontSize(14)
      .text(article.pull, 56, bodyY + 14, { width: doc.page.width - 112, lineGap: 2 });
  }
}

function drawBackPage(doc, pageNumber) {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.navy);
  doc
    .fillColor(COLORS.teal)
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('NEXT ISSUE', 56, 90, { characterSpacing: 2 });
  doc
    .fillColor(COLORS.paper)
    .font('Helvetica-Bold')
    .fontSize(28)
    .text('Q4 2026: Multi-agent orchestration at scale', 56, 116, {
      width: doc.page.width - 112,
    });
  doc
    .fillColor('#AEB8C9')
    .font('Helvetica')
    .fontSize(12)
    .text(
      'LEXIS OS is the AI engineering platform for teams building agents that have to work in production, not just in a demo. This issue was generated by the ai-engineering-from-scratch pipeline.',
      56,
      doc.y + 18,
      { width: doc.page.width - 112, lineGap: 3 }
    );
  doc
    .fillColor(COLORS.gray)
    .font('Helvetica')
    .fontSize(9)
    .text(String(pageNumber).padStart(2, '0'), doc.page.width - 106, doc.page.height - 40, {
      width: 50,
      align: 'right',
    });
}

function generate() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const doc = new PDFDocument(PAGE);
  const stream = fs.createWriteStream(OUT_FILE);
  doc.pipe(stream);

  drawCover(doc);

  doc.addPage();
  drawTOC(doc);

  articles.forEach((article) => {
    doc.addPage();
    drawArticle(doc, article);
  });

  doc.addPage();
  drawBackPage(doc, articles.length + 3);

  const range = doc.bufferedPageRange();
  const lastIndex = range.start + range.count - 1;
  for (let i = range.start + 1; i < lastIndex; i++) {
    doc.switchToPage(i);
    addFooter(doc, i + 1);
  }

  doc.end();

  stream.on('finish', () => {
    console.log(`Generated ${path.relative(process.cwd(), OUT_FILE)}`);
  });
  stream.on('error', (err) => {
    console.error('Failed to write PDF:', err);
    process.exitCode = 1;
  });
}

generate();
