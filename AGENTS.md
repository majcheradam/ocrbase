# ocrbase

This is light weight, model agnostic API standardizes integrating visual language models (VLMs) across supported models.

## ocrbase core

- parse() # turn document into text
- extract() # extract data from document into .json, supports structured outputs
- batchParse() # batch parse
- batchExtract() # batch extract

## ocrbase features

- s3 integration
- bullmq integration (parse/async, extract/async, batchParse, batchExtract)

## ocrbase models

- [glmocr](https://huggingface.co/zai-org/GLM-OCR)
- [paddleocr](https://huggingface.co/PaddlePaddle/PaddleOCR-VL)
