import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const assetsDir = path.resolve(__dirname, 'research_paper_assets');
const brainDir = path.resolve('C:/Users/vaishnavi/.gemini/antigravity/brain/481a8a4a-8159-4a0e-a389-f5212b627ab1');

const files = [
  {
    svg: 'figure1_system_architecture.svg',
    png: 'Figure_1_System_Architecture.png',
    width: 2400,
  },
  {
    svg: 'figure2_detection_workflow.svg',
    png: 'Figure_2_Project_Workflow.png',
    width: 2000,
  },
  {
    svg: 'figure3_hybrid_scoring_pipeline.svg',
    png: 'Figure_3_Hybrid_Scoring_Pipeline.png',
    width: 2400,
  },
  {
    svg: 'figure4_scam_threat_taxonomy.svg',
    png: 'Figure_4_Scam_Threat_Taxonomy.png',
    width: 2400,
  }
];

async function renderAll() {
  console.log('Starting high-res PNG rendering...');
  for (const item of files) {
    const svgPath = path.join(assetsDir, item.svg);
    const pngPath = path.join(assetsDir, item.png);
    const brainPngPath = path.join(brainDir, item.png);

    try {
      console.log(`Rendering ${item.svg} to ${item.png} at ${item.width}px width...`);
      const svgBuffer = fs.readFileSync(svgPath);
      await sharp(svgBuffer)
        .resize({ width: item.width })
        .png({ compressionLevel: 8 })
        .toFile(pngPath);
      
      console.log(`Saved: ${pngPath}`);
      fs.copyFileSync(pngPath, brainPngPath);
    } catch (err) {
      console.error(`Error rendering ${item.svg}:`, err);
    }
  }
  console.log('ALL FIGURES RENDERED AND SAVED SUCCESSFULLY!');
}

renderAll();
