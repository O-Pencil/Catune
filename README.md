# Posture-AI

An AI-powered on-device kinematics & rehabilitation tracking agent.

## Project Overview
Posture-AI combines high-frequency IMU capture with on-device Vision-Language Models (Qwen-VL via MNN) to provide a private, real-time spine posture correction system.

### Key Features
- **Real-time 3D Kinematics**: Tracking spine angles (Neck Pitch, Lumbar Roll).
- **React Native Dashboard**: Modern, flexible UI for data visualization.
- **On-Device AI**: Privacy-first vision baseline calibration using Qwen-VL.
- **MCP Integration**: Exposing physical kinematics as tools for LLM Agents (Claude Code).

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Android**:
   ```bash
   npx react-native run-android
   ```

3. **MCP Setup**:
   Launch the app and click "Start MCP Service" to get your local server URL and token.

## Documentation
- [Product Requirements Document (PRD)](docs/AI姿态矫正康复产品PRD.md)
- [Technical Draft (Chinese)](docs/技术草案.md)
- [Native Android Backend Readme](docs/README-Native.md)
- [React Native Frontend Readme](README-RN.md)
