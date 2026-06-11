/**
 * @file App.tsx
 * @description 跨平台 RN 仪表盘根组件（iOS/Android 通用，纯 TS）：由本地姿态引擎驱动，渲染分数 / 角度 / 状态 / 建议 + F7 Mock Console。
 *
 * [WHO] 默认导出 `function App(): React.JSX.Element`；用 `createPostureEngine` + `createMockSource` 驱动，`useState<DashboardState>` 持有状态
 * [FROM] 依赖 `react`、`react-native`、本地 `./src/posture`（engine / mock / types）
 * [TO] 被 `index.js` 通过 `AppRegistry.registerComponent(appName, () => App)` 注册并由 RN runtime 渲染
 * [HERE] 项目根 /App.tsx · 跨平台 RN 仪表盘入口
 *
 * 注：判定逻辑与模拟数据已从 Kotlin 迁到 TS，App 不再依赖原生模块，可同时跑 iOS / Android。
 * 端侧 Qwen+MNN 真推理为原生支线（见 docs/端侧模型对接计划.md），就绪后由 engine.commit() 改调原生 inferText。
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  NativeModules,
  useColorScheme,
  View,
  TouchableOpacity,
} from 'react-native';

import {
  Colors,
  Header,
} from 'react-native/Libraries/NewAppScreen';

import { createPostureEngine } from './src/posture/engine';
import { createMockSource, MockScenario, MockSource, SCENARIOS } from './src/posture/mock';
import { DashboardState } from './src/posture/types';

type MnnStatus = {
  nativeLibLoaded?: boolean;
  modelDirExists?: boolean;
  configExists?: boolean;
  modelLoaded?: boolean;
  modelDir?: string;
  loadError?: string | null;
};

type MnnInferResult = {
  rawOutput?: string;
  inferenceMs?: number;
  metrics?: {
    backend?: string;
    ttftMs?: number;
    decodeTps?: number;
    tokensGenerated?: number;
  };
};

const CatuneMnn = NativeModules.CatuneMnn as
  | {
      getStatus: () => Promise<MnnStatus>;
      inferText: (prompt: string) => Promise<MnnInferResult>;
    }
  | undefined;

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [kinematics, setKinematics] = useState<DashboardState>({
    neckPitch: 0,
    lumbarRoll: 0,
    posture: 'NORMAL',
    postureLabel: 'Initializing...',
    score: 100,
    abnormalDurationMinutes: 0,
    advice: '',
    inferenceSource: 'RULE_FALLBACK',
  });
  const [mnnStatus, setMnnStatus] = useState<MnnStatus | null>(null);
  const [mnnOutput, setMnnOutput] = useState<string>('');
  const [mnnBusy, setMnnBusy] = useState(false);

  const mockRef = useRef<MockSource | null>(null);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    flex: 1,
  };

  useEffect(() => {
    // 纯 TS：本地引擎 + 模拟数据源驱动，无原生依赖（iOS/Android 通用）
    const engine = createPostureEngine();
    const mock = createMockSource(engine);
    mockRef.current = mock;
    const unsubscribe = engine.subscribe(setKinematics);
    mock.start();
    return () => {
      mock.stop();
      unsubscribe();
    };
  }, []);

  const getStatusColor = () => {
    switch (kinematics.posture) {
      case 'NORMAL': return '#00ff00';
      case 'OFFLINE': return '#888';
      default: return '#ff3300';
    }
  };

  const refreshMnnStatus = async () => {
    if (!CatuneMnn) {
      setMnnStatus({ loadError: 'CatuneMnn native module is not registered.' });
      return;
    }
    setMnnBusy(true);
    try {
      const status = await CatuneMnn.getStatus();
      setMnnStatus(status);
      setMnnOutput('');
    } catch (error) {
      setMnnStatus({ loadError: error instanceof Error ? error.message : String(error) });
    } finally {
      setMnnBusy(false);
    }
  };

  const runMnnSmokeTest = async () => {
    if (!CatuneMnn) {
      setMnnStatus({ loadError: 'CatuneMnn native module is not registered.' });
      return;
    }
    setMnnBusy(true);
    try {
      const result = await CatuneMnn.inferText('请用一句中文提醒我坐直。');
      const metric = result.metrics
        ? `backend=${result.metrics.backend ?? 'unknown'} ttft=${result.metrics.ttftMs ?? 0}ms tps=${result.metrics.decodeTps ?? 0}`
        : 'metrics unavailable';
      setMnnOutput(`${metric}\n${result.rawOutput ?? ''}`.trim());
      const status = await CatuneMnn.getStatus();
      setMnnStatus(status);
    } catch (error) {
      setMnnOutput(error instanceof Error ? error.message : String(error));
      const status = await CatuneMnn.getStatus().catch(() => null);
      if (status) setMnnStatus(status);
    } finally {
      setMnnBusy(false);
    }
  };

  const renderMockConsole = () => (
    <View style={styles.consoleContainer}>
      <Text style={styles.consoleTitle}>F7 MOCK CONSOLE</Text>
      <View style={styles.buttonRow}>
        {SCENARIOS.map((scenario: MockScenario) => (
          <TouchableOpacity
            key={scenario}
            style={[styles.smallButton, kinematics.posture === scenario && styles.activeButton]}
            onPress={() => mockRef.current?.setScenario(scenario)}>
            <Text style={styles.smallButtonText}>{scenario.replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMnnPanel = () => (
    <View style={styles.mnnPanel}>
      <Text style={styles.mnnTitle}>MNN DEBUG</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.smallButton, mnnBusy && styles.disabledButton]}
          disabled={mnnBusy}
          onPress={refreshMnnStatus}>
          <Text style={styles.smallButtonText}>STATUS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.smallButton, mnnBusy && styles.disabledButton]}
          disabled={mnnBusy}
          onPress={runMnnSmokeTest}>
          <Text style={styles.smallButtonText}>INFER TEXT</Text>
        </TouchableOpacity>
      </View>
      {mnnStatus ? (
        <Text style={styles.mnnText}>
          native={String(mnnStatus.nativeLibLoaded)} modelDir={String(mnnStatus.modelDirExists)} config={String(mnnStatus.configExists)} loaded={String(mnnStatus.modelLoaded)}
          {mnnStatus.loadError ? `\n${mnnStatus.loadError}` : ''}
        </Text>
      ) : null}
      {mnnOutput ? <Text style={styles.mnnOutput}>{mnnOutput}</Text> : null}
    </View>
  );

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <Header />

        <View style={styles.mainContainer}>
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreLabel}>POSTURE SCORE</Text>
            <Text style={[styles.scoreValue, { color: getStatusColor() }]}>{kinematics.score}</Text>
          </View>

          <View style={styles.dataContainer}>
            <View style={styles.dataBox}>
              <Text style={styles.dataLabel}>Neck Pitch</Text>
              <Text style={[styles.dataValue, { color: '#00ff00' }]}>
                {kinematics.neckPitch.toFixed(1)}°
              </Text>
            </View>

            <View style={styles.dataBox}>
              <Text style={styles.dataLabel}>Lumbar Roll</Text>
              <Text style={[styles.dataValue, { color: '#00ddff' }]}>
                {kinematics.lumbarRoll.toFixed(1)}°
              </Text>
            </View>
          </View>

          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>Current State</Text>
            <Text style={[styles.statusValue, { color: getStatusColor() }]}>
              {kinematics.postureLabel}
            </Text>
          </View>

          {kinematics.advice ? (
            <View style={styles.adviceBox}>
              <Text style={styles.adviceLabel}>
                建议{kinematics.inferenceSource === 'RULE_FALLBACK' ? '（规则）' : ''}
              </Text>
              <Text style={styles.adviceValue}>{kinematics.advice}</Text>
            </View>
          ) : null}

          {renderMockConsole()}
          {renderMnnPanel()}

          <Text style={styles.dataSourceHint}>
            数据来源：本地模拟流（10Hz）· 端侧模型对接见 docs/端侧模型对接计划.md
          </Text>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    padding: 20,
  },
  scoreHeader: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: '#111',
    padding: 20,
    borderRadius: 100,
    width: 160,
    height: 160,
    alignSelf: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#333',
  },
  scoreLabel: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scoreValue: {
    fontSize: 60,
    fontWeight: '800',
  },
  dataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dataBox: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 12,
    width: '48%',
    alignItems: 'center',
  },
  dataLabel: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 5,
  },
  dataValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statusBox: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusLabel: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 5,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  consoleContainer: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#444',
  },
  consoleTitle: {
    color: '#ffdd00',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  smallButton: {
    backgroundColor: '#222',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  activeButton: {
    borderColor: '#ffdd00',
    backgroundColor: '#332200',
  },
  disabledButton: {
    opacity: 0.5,
  },
  smallButtonText: {
    color: '#ccc',
    fontSize: 10,
  },
  adviceBox: {
    backgroundColor: '#10210f',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1f3d1c',
  },
  adviceLabel: {
    color: '#7bdc6e',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  adviceValue: {
    color: '#d6f5d0',
    fontSize: 14,
    lineHeight: 20,
  },
  dataSourceHint: {
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  mnnPanel: {
    backgroundColor: '#111827',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#263244',
  },
  mnnTitle: {
    color: '#93c5fd',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  mnnText: {
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 10,
  },
  mnnOutput: {
    color: '#e0f2fe',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
});

export default App;
