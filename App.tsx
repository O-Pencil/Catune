/**
 * @file App.tsx
 * @description 统一 Expo App 入口（iOS / Android / Web 一份代码）：本地引擎 + 手机传感器(优先)/模拟(回退) 驱动共享 Dashboard，底部传感器切换 + F7 Mock Console。
 *
 * [WHO] 默认导出 `App`；用 `createPostureEngine` + `createSensorSource`(回退 `createMockSource`)，复用 `Dashboard`
 * [FROM] 依赖 `react`、`react-native`、`expo-status-bar`、`./src/posture`（Dashboard/engine/mock/sensorSource/types）
 * [TO] 被 `index.js`(registerRootComponent) 注册
 * [HERE] 项目根 /App.tsx · 统一 Expo App 入口
 *
 * 一份 UI/逻辑跑 iOS/Android/Web：web(RNW) 无传感器 → 自动回退 mock。
 * 端侧 Qwen+MNN 为安卓原生支线（docs/端侧模型对接计划.md），就绪后由 engine.commit() 改调原生 inferText。
 */
import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {StatusBar} from 'expo-status-bar';

import Dashboard from './src/posture/Dashboard';
import {createPostureEngine} from './src/posture/engine';
import {createMockSource, MockScenario, MockSource, SCENARIOS} from './src/posture/mock';
import {createSensorSource, SensorSource} from './src/posture/sensorSource';
import {DashboardState} from './src/posture/types';

const INITIAL: DashboardState = {
  neckPitch: 0,
  thorPitch: 0,
  lumbarRoll: 0,
  posture: 'NORMAL',
  postureLabel: 'Initializing…',
  score: 100,
  abnormalDurationMinutes: 0,
  advice: '',
  inferenceSource: 'RULE_FALLBACK',
};

type Mode = 'loading' | 'sensor' | 'mock';

function App(): React.JSX.Element {
  const [k, setK] = useState<DashboardState>(INITIAL);
  const [mode, setMode] = useState<Mode>('loading');

  const engineRef = useRef(createPostureEngine());
  const sensorRef = useRef<SensorSource>(createSensorSource(engineRef.current));
  const mockRef = useRef<MockSource>(createMockSource(engineRef.current));

  const useSensor = async () => {
    mockRef.current.stop();
    const ok = await sensorRef.current.start();
    if (ok) {
      setMode('sensor');
    } else {
      mockRef.current.start();
      setMode('mock');
    }
  };

  const useMock = () => {
    sensorRef.current.stop();
    mockRef.current.resume();
    mockRef.current.start();
    setMode('mock');
  };

  const pinScenario = (scenario: MockScenario) => {
    sensorRef.current.stop();
    mockRef.current.start();
    mockRef.current.setScenario(scenario);
    setMode('mock');
  };

  useEffect(() => {
    const unsubscribe = engineRef.current.subscribe(setK);
    useSensor();
    return () => {
      unsubscribe();
      sensorRef.current.stop();
      mockRef.current.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subtitle =
    mode === 'sensor'
      ? '数据源：手机传感器 · 前后/左右倾斜手机'
      : mode === 'mock'
      ? '数据源：本地模拟流（10Hz）'
      : '检测传感器中…';

  const footer = (
    <View style={styles.footer}>
      <View style={styles.toggleRow}>
        <Toggle active={mode === 'sensor'} label="传感器" onPress={useSensor} />
        <Toggle active={mode === 'mock'} label="模拟" onPress={useMock} />
      </View>

      <View style={styles.console}>
        <Text style={styles.consoleTitle}>F7 MOCK CONSOLE</Text>
        <View style={styles.buttonRow}>
          {SCENARIOS.map((scenario: MockScenario) => (
            <TouchableOpacity
              key={scenario}
              style={[styles.btn, mode === 'mock' && k.posture === scenario && styles.btnActive]}
              onPress={() => pinScenario(scenario)}>
              <Text style={styles.btnText}>{scenario.replace('_', ' ')}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <StatusBar style="light" />
    </View>
  );

  return <Dashboard state={k} subtitle={subtitle} footer={footer} />;
}

function Toggle({active, label, onPress}: {active: boolean; label: string; onPress: () => void}): React.JSX.Element {
  return (
    <TouchableOpacity style={[styles.toggle, active && styles.toggleActive]} onPress={onPress}>
      <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  footer: {width: '100%', alignItems: 'center'},
  toggleRow: {flexDirection: 'row', gap: 12, marginBottom: 12},
  toggle: {paddingVertical: 8, paddingHorizontal: 24, borderRadius: 8, borderWidth: 1, borderColor: '#333', backgroundColor: '#1a1a1a'},
  toggleActive: {borderColor: '#ffdd00', backgroundColor: '#332200'},
  toggleText: {color: '#ccc', fontSize: 14},
  toggleTextActive: {color: '#ffdd00', fontWeight: '700'},
  console: {backgroundColor: '#000', padding: 15, borderRadius: 12, width: '100%', borderWidth: 1, borderColor: '#444', marginBottom: 8},
  consoleTitle: {color: '#ffdd00', fontSize: 10, fontWeight: 'bold', marginBottom: 10, textAlign: 'center'},
  buttonRow: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8},
  btn: {backgroundColor: '#222', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#333'},
  btnActive: {borderColor: '#ffdd00', backgroundColor: '#332200'},
  btnText: {color: '#ccc', fontSize: 10},
});

export default App;
