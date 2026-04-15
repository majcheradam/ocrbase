# ocrbase

Lightweight, model-agnostic API for integrating visual language models (VLMs).

## Core

- `/v1/parse` — turn a document into text

## Models

Both models are state of the art on [OmniDocBench v1.5](https://github.com/opendatalab/OmniDocBench):

- [glmocr](https://huggingface.co/zai-org/GLM-OCR) — 94.6
- [paddleocr](https://huggingface.co/PaddlePaddle/PaddleOCR-VL) — 94.5

## Requirements

ocrbase does not ship the models — point it at a running inference server:

- paddleocr — set up PaddleOCR-VL: https://www.paddleocr.ai/latest/en/version3.x/pipeline_usage/PaddleOCR-VL.html
- glm_ocr — self-host GLM-OCR with vLLM / SGLang: https://github.com/zai-org/GLM-OCR?tab=readme-ov-file#option-2-self-host-with-vllm--sglang

## Self host

```sh
docker run -d -p 3000:3000 \
  -e GLM_OCR_URL=http://localhost:5002 \
  -e PADDLEOCR_URL=http://localhost:8190 \
  --name ocrbase ghcr.io/ocrbase/ocrbase
```

## Develop

```sh
bun install
bun dev
```
