/**
 * @file modelCatalog.ts
 * @description 端侧 MNN 模型清单。须与 android MnnModelPaths.DEFAULT_MODEL_ID 默认项一致。
 *
 * [WHO] 导出 `MnnModelDef`、`MNN_MODELS_ROOT`、`ACTIVE_MODEL_FILE`、`DOWNLOAD_STATE_FILE`、
 *   `DEFAULT_MODEL_ID`、`MODEL_CATALOG`、`getDefaultModel`、`getModelById`
 * [FROM] 无外部依赖
 * [TO] 被 `modelStorage`、`modelDownloadService`、`deviceProfile`、`ModelDownloadCard`、
 *   `ModelDownloadBanner`、`assess/readiness` 引用
 * [HERE] src/mnn/modelCatalog.ts · 端侧模型清单与元数据
 */
export type MnnModelDef = {
  id: string;
  label: string;
  sizeHint: string;
  /** 相对 documentDirectory，如 mnn_models/qwen2.5-0.5b/ */
  subdir: string;
  baseUrl: string;
  files: readonly string[];
  /** 官方仓库运行文件的估算下载体积（字节），用于空间判断。 */
  estimatedDownloadBytes: number;
  /** 建议的最低物理内存（GB）；低于该值仍允许手动选择，但不自动推荐。 */
  recommendedMemoryGB: number;
  /** 文件最小字节数；用于拒绝下载中断后留下的错误页或截断文件。 */
  minimumFileBytes?: Readonly<Record<string, number>>;
  /** emulator=模拟器联调；device=真机推荐；sme2=SME2 验收用大模型 */
  tags: readonly ('emulator' | 'device' | 'sme2')[];
  /** 视觉模型（VL）：走 analyzeImage 图像路径用于体态评估；不作为文本教练默认。 */
  vision?: boolean;
  /**
   * 模拟器提示（旧字段，zh 原文）。新 UI 优先用 emulatorNoteKey 走 tr(locale, key)，
   * 旧字段保留做兜底/向后兼容。
   */
  emulatorNote?: string;
  /** emulatorNote 的 i18n key（首选）。 */
  emulatorNoteKey?: string;
};

export const MNN_MODELS_ROOT = 'mnn_models/';
export const ACTIVE_MODEL_FILE = `${MNN_MODELS_ROOT}.active`;
export const DOWNLOAD_STATE_FILE = `${MNN_MODELS_ROOT}.download_state.json`;

export const DEFAULT_MODEL_ID = 'qwen2.5-0.5b';

const MNN_FILE_SET = [
  'config.json',
  'llm_config.json',
  'llm.mnn',
  'llm.mnn.weight',
  'tokenizer.txt',
] as const;

// VL 模型在 LLM 文件集基础上多视觉编码器文件。
// ⚠ 下载前务必核对所选 HF 仓库实际文件名（不同导出可能为 visual.mnn 单文件或含 .weight），否则下载会 404。
const VL_FILE_SET = [...MNN_FILE_SET, 'visual.mnn', 'visual.mnn.weight'] as const;

const QWEN25_05B_FILE_SET = [...MNN_FILE_SET, 'embeddings_bf16.bin'] as const;

const QWEN25_05B_MINIMUM_BYTES: Readonly<Record<string, number>> = {
  'config.json': 100,
  'llm_config.json': 200,
  'llm.mnn': 500_000,
  'llm.mnn.weight': 270_000_000,
  'tokenizer.txt': 3_000_000,
  'embeddings_bf16.bin': 270_000_000,
};

const QWEN35_08B_MINIMUM_BYTES: Readonly<Record<string, number>> = {
  'config.json': 500,
  'llm_config.json': 8_000,
  'llm.mnn': 2_000_000,
  'llm.mnn.weight': 460_000_000,
  'tokenizer.txt': 6_000_000,
  'visual.mnn': 200_000,
  'visual.mnn.weight': 60_000_000,
};

const QWEN35_2B_MINIMUM_BYTES: Readonly<Record<string, number>> = {
  ...QWEN35_08B_MINIMUM_BYTES,
  'llm.mnn.weight': 1_160_000_000,
  'visual.mnn': 450_000,
  'visual.mnn.weight': 190_000_000,
};

const QWEN35_4B_MINIMUM_BYTES: Readonly<Record<string, number>> = {
  ...QWEN35_2B_MINIMUM_BYTES,
  'llm.mnn': 3_500_000,
  'llm.mnn.weight': 2_600_000_000,
};

export const MODEL_CATALOG: readonly MnnModelDef[] = [
  {
    id: 'qwen2.5-0.5b',
    label: 'Qwen2.5-0.5B',
    sizeHint: '~557MB',
    subdir: `${MNN_MODELS_ROOT}qwen2.5-0.5b/`,
    baseUrl: 'https://huggingface.co/taobao-mnn/Qwen2.5-0.5B-Instruct-MNN/resolve/main/',
    files: QWEN25_05B_FILE_SET,
    estimatedDownloadBytes: 557 * 1024 * 1024,
    recommendedMemoryGB: 4,
    minimumFileBytes: QWEN25_05B_MINIMUM_BYTES,
    tags: ['emulator', 'device'],
    emulatorNote: '模拟器可跑通下载与 UI；INT4 推理易出现乱码，中文质量以真机为准。',
    emulatorNoteKey: 'device.model.emulatorNote.qwen25_05b',
  },
  {
    id: 'qwen3-1.7b',
    label: 'Qwen3-1.7B',
    sizeHint: '~1.2GB',
    subdir: `${MNN_MODELS_ROOT}qwen3-1.7b/`,
    baseUrl: 'https://huggingface.co/taobao-mnn/Qwen3-1.7B-MNN/resolve/main/',
    files: MNN_FILE_SET,
    estimatedDownloadBytes: 1_240_000_000,
    recommendedMemoryGB: 6,
    tags: ['device', 'sme2'],
    emulatorNote: '体积大，模拟器易 OOM；仅建议在 SME2/大内存真机验收。',
    emulatorNoteKey: 'device.model.emulatorNote.qwen3_17b',
  },
  {
    id: 'qwen3.5-0.8b',
    label: 'Qwen3.5-0.8B',
    sizeHint: '~517MiB',
    subdir: `${MNN_MODELS_ROOT}qwen3.5-0.8b/`,
    baseUrl: 'https://huggingface.co/taobao-mnn/Qwen3.5-0.8B-MNN/resolve/main/',
    files: VL_FILE_SET,
    estimatedDownloadBytes: 542_300_560,
    recommendedMemoryGB: 6,
    minimumFileBytes: QWEN35_08B_MINIMUM_BYTES,
    tags: ['device'],
    vision: true,
    emulatorNote: 'Qwen3.5 轻量多模态模型；文本教练可用，视觉路径需在真机单独验收。',
    emulatorNoteKey: 'device.model.emulatorNote.qwen35_08b',
  },
  {
    id: 'qwen3.5-2b',
    label: 'Qwen3.5-2B',
    sizeHint: '~1.29GiB',
    subdir: `${MNN_MODELS_ROOT}qwen3.5-2b/`,
    baseUrl: 'https://huggingface.co/taobao-mnn/Qwen3.5-2B-MNN/resolve/main/',
    files: VL_FILE_SET,
    estimatedDownloadBytes: 1_381_346_269,
    recommendedMemoryGB: 8,
    minimumFileBytes: QWEN35_2B_MINIMUM_BYTES,
    tags: ['device', 'sme2'],
    vision: true,
    emulatorNote: '适合 8GB 以上 arm64 真机；Qwen3.5 需要包含线性注意力支持的 MNN 运行库。',
    emulatorNoteKey: 'device.model.emulatorNote.qwen35_2b',
  },
  {
    id: 'qwen3.5-4b',
    label: 'Qwen3.5-4B',
    sizeHint: '~2.64GiB',
    subdir: `${MNN_MODELS_ROOT}qwen3.5-4b/`,
    baseUrl: 'https://huggingface.co/taobao-mnn/Qwen3.5-4B-MNN/resolve/main/',
    files: VL_FILE_SET,
    estimatedDownloadBytes: 2_836_770_850,
    recommendedMemoryGB: 12,
    minimumFileBytes: QWEN35_4B_MINIMUM_BYTES,
    tags: ['device', 'sme2'],
    vision: true,
    emulatorNote: '旗舰真机实验模型；建议 12GB 以上 RAM、SME2/i8mm 和至少 5GB 可用空间。',
    emulatorNoteKey: 'device.model.emulatorNote.qwen35_4b',
  },
  {
    id: 'qwen2-vl-2b',
    label: 'Qwen2-VL-2B（体态评估）',
    sizeHint: '~1.5GB',
    subdir: `${MNN_MODELS_ROOT}qwen2-vl-2b/`,
    baseUrl: 'https://huggingface.co/taobao-mnn/Qwen2-VL-2B-Instruct-MNN/resolve/main/',
    files: VL_FILE_SET,
    estimatedDownloadBytes: 1_500_000_000,
    recommendedMemoryGB: 8,
    tags: ['device', 'sme2'],
    vision: true,
    emulatorNote: '视觉模型，供 AI 评估的 analyzeImage 路径；仅真机、体积大、易 OOM。' +
      '下载前核对仓库文件名；可能需 libMNN 含视觉支持重编。设为活跃模型后端侧 VL 评估才生效。',
    emulatorNoteKey: 'device.model.emulatorNote.qwen2_vl_2b',
  },
];

/** 视觉（VL）模型清单（用于端侧体态评估）。 */
export function getVisionModels(): readonly MnnModelDef[] {
  return MODEL_CATALOG.filter(m => m.vision);
}

export function getModelById(id: string): MnnModelDef | undefined {
  return MODEL_CATALOG.find(m => m.id === id);
}

export function getDefaultModel(): MnnModelDef {
  return getModelById(DEFAULT_MODEL_ID) ?? MODEL_CATALOG[0];
}
