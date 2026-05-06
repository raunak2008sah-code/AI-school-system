"""Re-export the already trained model as a browser-safe TensorFlow.js model.

This does not retrain. It loads trained_model/navyug_face_model.h5, copies matching
weights into an inference-only EfficientNetB0 model, and exports model/.
"""

from __future__ import annotations

import os
import shutil
import subprocess
from pathlib import Path

import tensorflow as tf

from train_face_model import IMG_SIZE, PROJECT_ROOT, KERAS_OUTPUT_DIR, TFJS_OUTPUT_DIR, build_model


SOURCE_MODEL = KERAS_OUTPUT_DIR / "navyug_face_model.h5"
REPAIRED_MODEL = KERAS_OUTPUT_DIR / "navyug_face_model_inference.h5"
SAVED_MODEL_DIR = KERAS_OUTPUT_DIR / "navyug_face_model_savedmodel"


def copy_matching_weights(source_model, target_model):
    copied = 0
    skipped = 0
    source_layers = {layer.name: layer for layer in source_model.layers}

    for target_layer in target_model.layers:
        source_layer = source_layers.get(target_layer.name)
        if not source_layer:
            skipped += 1
            continue

        source_weights = source_layer.get_weights()
        target_weights = target_layer.get_weights()
        if source_weights and [item.shape for item in source_weights] == [item.shape for item in target_weights]:
            target_layer.set_weights(source_weights)
            copied += 1
        else:
            skipped += 1

    print(f"Copied weights for {copied} layers. Skipped {skipped} layers.")


def export_tfjs(saved_model_dir: Path):
    converter = shutil.which("tensorflowjs_converter")
    if not converter:
        raise SystemExit("tensorflowjs_converter was not found.")

    env = os.environ.copy()
    env["PYTHONPATH"] = str(PROJECT_ROOT / "tools" / "converter_stubs") + os.pathsep + env.get("PYTHONPATH", "")
    subprocess.run([
        converter,
        "--input_format=tf_saved_model",
        "--output_format=tfjs_graph_model",
        "--signature_name=serving_default",
        "--saved_model_tags=serve",
        str(saved_model_dir),
        str(TFJS_OUTPUT_DIR),
    ], check=True, env=env)


def main():
    if not SOURCE_MODEL.exists():
        raise SystemExit(f"Trained model not found: {SOURCE_MODEL}")

    print(f"Loading trained model: {SOURCE_MODEL}")
    source_model = tf.keras.models.load_model(SOURCE_MODEL, compile=False)
    class_count = source_model.output_shape[-1]
    target_model, _ = build_model(tf, class_count, learning_rate=1e-3)
    copy_matching_weights(source_model, target_model)
    target_model.save(REPAIRED_MODEL, include_optimizer=False)
    print(f"Saved browser-safe model: {REPAIRED_MODEL}")
    if SAVED_MODEL_DIR.exists():
        shutil.rmtree(SAVED_MODEL_DIR)
    target_model.save(SAVED_MODEL_DIR, include_optimizer=False, save_format="tf")
    print(f"Saved inference SavedModel: {SAVED_MODEL_DIR}")
    export_tfjs(SAVED_MODEL_DIR)
    print(f"Exported browser-safe TensorFlow.js graph model to: {TFJS_OUTPUT_DIR}")


if __name__ == "__main__":
    main()
