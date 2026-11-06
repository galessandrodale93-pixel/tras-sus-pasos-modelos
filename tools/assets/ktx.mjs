// codifica las texturas PBR a KTX2: color en ETC1S (sRGB), normales en UASTC + RDO + zstd (sin perder resolución)
import { encodeToKTX2 } from 'ktx2-encoder';
import sharp from 'sharp';
import fs from 'fs';
const SRC = '/home/claude/assets-src/ph_tex/', OUT = process.argv[2], ONLY = process.argv[3] ? process.argv[3].split(',') : null;
const dec = async b => { const { data, info } = await sharp(b).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { data: new Uint8Array(data), width: info.width, height: info.height }; };
const files = fs.readdirSync(SRC).filter(f => /_(diff|nor|rough)_(1k|2k|4k)\.(jpg|png)$/.test(f)).sort((a, b) => a.includes('_4k') - b.includes('_4k'));
for (const f of files) {
  const [, id, m, r] = f.match(/^(.*)_(diff|nor|rough)_(1k|2k|4k)\./); if (ONLY && !ONLY.includes(id)) continue;
  if (m !== 'diff' && r === '4k') continue; // Ultra: color a 4k; normales y rugosidad a 2k (UASTC) para no pasar el presupuesto
  const out = `${OUT}/${r}/${id}_${m}.ktx2`; if (fs.existsSync(out)) continue; fs.mkdirSync(`${OUT}/${r}`, { recursive: true });
  const t0 = Date.now(), buf = new Uint8Array(fs.readFileSync(SRC + f));
  const o = m === 'nor' ? { isUASTC: true, isNormalMap: true, enableRDO: true, rdoQualityLevel: 1.5, needSupercompression: true, generateMipmap: true, isSetKTX2SRGBTransferFunc: false, isPerceptual: false, uastcLDRQualityLevel: 1 }
    : m === 'diff' ? { isUASTC: false, qualityLevel: 190, compressionLevel: 2, generateMipmap: true, isSetKTX2SRGBTransferFunc: true, isPerceptual: true }
    : { isUASTC: false, qualityLevel: 150, compressionLevel: 2, generateMipmap: true, isSetKTX2SRGBTransferFunc: false, isPerceptual: false };
  const k = await encodeToKTX2(buf, Object.assign({ imageDecoder: dec }, o)); fs.writeFileSync(out, k);
  console.log(f, '->', (k.length / 1024).toFixed(0) + 'KB', ((Date.now() - t0) / 1000).toFixed(1) + 's');
}
console.log('done');
