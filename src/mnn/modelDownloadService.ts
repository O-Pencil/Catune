/**
 * 全局模型下载服务：与 UI 组件生命周期解耦，切 Tab / App 退后台时下载仍可继续。
 * 进程被系统杀死后，下次打开 App 会根据 .download_state.json 自动续传。
 */
import {NativeModules} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import {getDefaultModel, getModelById, MnnModelDef} from './modelCatalog';
import {
  deleteModelFiles,
  fileSizeBytes,
  modelDir,
  readDownloadState,
  writeActiveModelId,
  writeDownloadState,
} from './modelStorage';

export type DownloadJobStatus = 'idle' | 'downloading' | 'done' | 'error';

export type DownloadJobSnapshot = {
  status: DownloadJobStatus;
  modelId: string | null;
  progress: number;
  currentFile: string;
  error: string | null;
};

type Listener = (snapshot: DownloadJobSnapshot) => void;

type CatuneMnnModule = {
  releaseModel?: () => Promise<boolean>;
};

const CatuneMnn = NativeModules.CatuneMnn as CatuneMnnModule | undefined;

let snapshot: DownloadJobSnapshot = {
  status: 'idle',
  modelId: null,
  progress: 0,
  currentFile: '',
  error: null,
};

const listeners = new Set<Listener>();
let running = false;
let abortRequested = false;

function emit(): void {
  listeners.forEach(fn => fn(snapshot));
}

function setSnapshot(partial: Partial<DownloadJobSnapshot>): void {
  snapshot = {...snapshot, ...partial};
  emit();
}

export function subscribeModelDownload(listener: Listener): () => void {
  listeners.add(listener);
  listener(snapshot);
  return () => listeners.delete(listener);
}

export function getDownloadSnapshot(): DownloadJobSnapshot {
  return snapshot;
}

async function releaseNativeModel(): Promise<void> {
  try {
    await CatuneMnn?.releaseModel?.();
  } catch {
    // ignore
  }
}

async function downloadModelFiles(
  docDir: string,
  model: MnnModelDef,
  replaceExisting: boolean,
): Promise<void> {
  if (replaceExisting) {
    await deleteModelFiles(docDir, model);
  }
  const dir = modelDir(docDir, model);
  await FileSystem.makeDirectoryAsync(dir, {intermediates: true});

  let pending = await readDownloadState(docDir);
  if (pending?.modelId !== model.id) {
    pending = {modelId: model.id, fileIndex: 0, inProgress: true, updatedAt: Date.now()};
  } else {
    pending = {...pending, inProgress: true, updatedAt: Date.now()};
  }
  await writeDownloadState(docDir, pending);

  for (let i = pending.fileIndex; i < model.files.length; i++) {
    if (abortRequested) {
      await writeDownloadState(docDir, {...pending, inProgress: true, updatedAt: Date.now()});
      setSnapshot({status: 'idle'});
      running = false;
      return;
    }

    const fileName = model.files[i];
    const target = dir + fileName;
    const existing = await FileSystem.getInfoAsync(target);
    const existingSize = existing.exists ? fileSizeBytes(existing) : 0;
    if (existingSize > 0 && fileName !== 'llm.mnn.weight') {
      setSnapshot({progress: (i + 1) / model.files.length, currentFile: fileName});
      pending = {modelId: model.id, fileIndex: i + 1, inProgress: true, updatedAt: Date.now()};
      await writeDownloadState(docDir, i + 1 >= model.files.length ? null : pending);
      continue;
    }

    setSnapshot({currentFile: fileName});
    const fileUrl = model.baseUrl + fileName;
    const savedPause =
      pending?.pauseState?.url === fileUrl && pending.pauseState.fileUri === target
        ? pending.pauseState
        : undefined;
    const dl = FileSystem.createDownloadResumable(
      fileUrl,
      target,
      {},
      p => {
        const filePct = p.totalBytesExpectedToWrite > 0 ? p.totalBytesWritten / p.totalBytesExpectedToWrite : 0;
        setSnapshot({progress: (i + filePct) / model.files.length});
      },
      savedPause?.resumeData,
    );

    try {
      const result = savedPause?.resumeData ? await dl.resumeAsync() : await dl.downloadAsync();
      if (!result) {
        throw new Error(`下载失败：${fileName}`);
      }
    } catch (downloadErr) {
      await writeDownloadState(docDir, {
        modelId: model.id,
        fileIndex: i,
        inProgress: true,
        pauseState: dl.savable(),
        updatedAt: Date.now(),
      });
      throw downloadErr;
    }

    pending = {modelId: model.id, fileIndex: i + 1, inProgress: true, updatedAt: Date.now()};
    await writeDownloadState(docDir, i + 1 >= model.files.length ? null : pending);
  }

  await writeDownloadState(docDir, null);
  await writeActiveModelId(docDir, model.id);
  await releaseNativeModel();
  setSnapshot({status: 'done', progress: 1, error: null});
}

export async function startModelDownload(modelId: string, replaceExisting = false): Promise<void> {
  const docDir = FileSystem.documentDirectory;
  if (!docDir) {
    throw new Error('当前平台不支持文件下载');
  }
  if (running) {
    return;
  }

  const model = getModelById(modelId) ?? getDefaultModel();
  running = true;
  abortRequested = false;
  setSnapshot({
    status: 'downloading',
    modelId: model.id,
    progress: 0,
    currentFile: '',
    error: null,
  });

  try {
    await downloadModelFiles(docDir, model, replaceExisting);
    if (!abortRequested) {
      setSnapshot({status: 'done'});
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    setSnapshot({status: 'error', error: message});
    throw e;
  } finally {
    running = false;
  }
}

export function cancelModelDownload(): void {
  abortRequested = true;
}

/** App 启动时：若有未完成的 inProgress 任务，自动续传。 */
export async function resumePendingDownloadIfNeeded(): Promise<boolean> {
  const docDir = FileSystem.documentDirectory;
  if (!docDir || running) {
    return false;
  }
  const pending = await readDownloadState(docDir);
  if (!pending?.inProgress) {
    return false;
  }
  try {
    await startModelDownload(pending.modelId, false);
    return true;
  } catch {
    return false;
  }
}
