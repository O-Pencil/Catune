/**
 * 端侧 MNN 模型清单。须与 android MnnModelPaths.DEFAULT_MODEL_ID 默认项一致。
 */
export type MnnModelDef = {
  id: string;
  label: string;
  sizeHint: string;
  /** 相对 documentDirectory，如 mnn_models/qwen2.5-0.5b/ */
  subdir: string;
  baseUrl: string;
  files: readonly string[];
  /** emulator=模拟器联调；device=真机推荐；sme2=SME2 验收用大模型 */
  tags: readonly ('emulator' | 'device' | 'sme2')[];
  emulatorNote?: string;
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
  'embeddings_bf16.bin',
] as const;

export const MODEL_CATALOG: readonly MnnModelDef[] = [
  {
    id: 'qwen2.5-0.5b',
    label: 'Qwen2.5-0.5B',
    sizeHint: '~550MB',
    subdir: `${MNN_MODELS_ROOT}qwen2.5-0.5b/`,
    baseUrl: 'https://hf-mirror.com/taobao-mnn/Qwen2.5-0.5B-Instruct-MNN/resolve/main/',
    files: MNN_FILE_SET,
    tags: ['emulator', 'device'],
    emulatorNote: '模拟器可跑通下载与 UI；INT4 推理易出现乱码，中文质量以真机为准。',
  },
  {
    id: 'qwen3-1.7b',
    label: 'Qwen3-1.7B',
    sizeHint: '~1.2GB',
    subdir: `${MNN_MODELS_ROOT}qwen3-1.7b/`,
    baseUrl: 'https://hf-mirror.com/taobao-mnn/Qwen3-1.7B-MNN/resolve/main/',
    files: MNN_FILE_SET,
    tags: ['device', 'sme2'],
    emulatorNote: '体积大，模拟器易 OOM；仅建议在 SME2/大内存真机验收。',
  },
];

export function getModelById(id: string): MnnModelDef | undefined {
  return MODEL_CATALOG.find(m => m.id === id);
}

export function getDefaultModel(): MnnModelDef {
  return getModelById(DEFAULT_MODEL_ID) ?? MODEL_CATALOG[0];
}
