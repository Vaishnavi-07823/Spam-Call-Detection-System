import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, 'research_paper_assets');

const files = [
  { svg: 'figure1_system_architecture.svg', png: 'figure1_system_architecture.png', width: 2200 },
  { svg: 'figure2_detection_workflow.svg', png: 'figure2_detection_workflow.png', width: 1800 },
  { svg: 'figure3_hybrid_scoring_pipeline.svg', png: 'figure3_hybrid_scoring_pipeline.png', width: 2200 },
  { svg: 'figure4_scam_threat_taxonomy.svg', png: 'figure4_scam_threat_taxonomy.png', width: 2200 },
];

for (const f of files) {
  const svgBuf = fs.readFileSync(path.join(assetsDir, f.svg));
  await sharp(svgBuf)
    .resize({ width: f.width })
    .png()
    .toFile(path.join(assetsDir, f.png));
  console.log('Saved:', f.png);
}
console.log('All PNGs created successfully!');
