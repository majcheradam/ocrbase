<div align="center">
  <h1>ocrbase: Model-Agnostic OCR API</h1>
  <p>
    <a href="https://github.com/ocrbase-hq/ocrbase/releases"><img src="https://img.shields.io/github/v/release/ocrbase-hq/ocrbase?color=blue" alt="Release"></a>
    <a href="https://github.com/ocrbase-hq/ocrbase/pkgs/container/ocrbase"><img src="https://img.shields.io/badge/ghcr.io-ocrbase--hq%2Focrbase-2496ED?logo=docker&logoColor=white" alt="Docker"></a>
    <img src="https://img.shields.io/badge/runtime-Bun-black?logo=bun&logoColor=white" alt="Bun">
    <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
  </p>
</div>

📄 **ocrbase** is a **lightweight, model-agnostic** API that standardizes document parsing across visual language models (VLMs).

## Key Features of ocrbase

🪶 **Lightweight**: Tiny Bun + Elysia service, single container, minimal footprint.

🔌 **Model-Agnostic**: Point at any supported VLM — GLM-OCR, PaddleOCR-VL — via env vars.

📊 **State of the Art**: Backed by models scoring ≥94.5 on OmniDocBench v1.5.

💎 **Easy to Deploy**: [One command](#-quick-start) away from a working OCR API.

## 🧩 Core

- `/v1/parse` — turn a document into text

## 🧠 Models

Both models are state of the art:

- **[paddleocr](https://huggingface.co/PaddlePaddle/PaddleOCR-VL)** — **94.5** on [OmniDocBench v1.5](https://github.com/opendatalab/OmniDocBench)
- **[glmocr](https://huggingface.co/zai-org/GLM-OCR)** — **94.6** on [OmniDocBench v1.5](https://github.com/opendatalab/OmniDocBench)

## 📋 Requirements

> [!IMPORTANT]
> ocrbase does not ship the models — point it at a running inference server:

- **[paddleocr](https://www.paddleocr.ai/latest/en/version3.x/pipeline_usage/PaddleOCR-VL.html)** — set up [PaddleOCR-VL](https://www.paddleocr.ai/latest/en/version3.x/pipeline_usage/PaddleOCR-VL.html)
- **[glmocr](https://github.com/zai-org/GLM-OCR?tab=readme-ov-file#option-2-self-host-with-vllm--sglang)** — self-host [GLM-OCR with vLLM](https://github.com/zai-org/GLM-OCR?tab=readme-ov-file#option-2-self-host-with-vllm--sglang)

## 🚀 Quick Start

```sh
docker run -d -p 3000:3000 \
  -e PADDLEOCR_URL=http://localhost:8190 \
  -e GLM_OCR_URL=http://localhost:5002 \
  --name ocrbase ghcr.io/ocrbase-hq/ocrbase
```

## 🛠️ Develop

```sh
bun install
bun dev
```
