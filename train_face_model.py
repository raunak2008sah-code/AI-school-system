"""
Train a NAVYUG student face attendance model from the local photo folder.

Expected dataset:
  photo/
    aarti/
      image1.jpg
      image2.jpg
    ayush/
      image1.jpg

Outputs:
  trained_model/navyug_face_model.h5
  trained_model/labels.json
  model/model.json
  model/weights.bin
  model/metadata.json

The frontend attendance page reads the TensorFlow.js model from model/.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent
PHOTO_DIR = PROJECT_ROOT / "photo"
KERAS_OUTPUT_DIR = PROJECT_ROOT / "trained_model"
TFJS_OUTPUT_DIR = PROJECT_ROOT / "model"
CROPPED_PHOTO_DIR = PROJECT_ROOT / ".face_training_cache"
IMG_SIZE = 224
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

FOLDER_TO_STUDENT_NAME = {
    "aarti": "AARTI",
    "ayush": "AYUSH KUMAR",
    "mayank": "MAYANK ARYA",
    "nitesh": "NITESH MAURYA",
    "raunak": "RAUNAK KUMAR",
    "saniya": "SANIYA MAHAR",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train NAVYUG face attendance model.")
    parser.add_argument("--photo-dir", type=Path, default=PHOTO_DIR, help="Folder containing student photo subfolders.")
    parser.add_argument("--epochs", type=int, default=18, help="Training epochs for the classifier head.")
    parser.add_argument("--fine-tune-epochs", type=int, default=0, help="Extra epochs after unfreezing top EfficientNet layers.")
    parser.add_argument("--batch-size", type=int, default=16, help="Training batch size.")
    parser.add_argument("--validation-split", type=float, default=0.2, help="Validation split from each class.")
    parser.add_argument("--learning-rate", type=float, default=1e-3, help="Initial learning rate.")
    parser.add_argument("--fine-tune-learning-rate", type=float, default=1e-5, help="Fine-tuning learning rate.")
    parser.add_argument("--no-face-crop", action="store_true", help="Skip OpenCV face cropping and train from raw images.")
    parser.add_argument("--skip-tfjs", action="store_true", help="Only create the Keras model, skip TensorFlow.js export.")
    return parser.parse_args()


def require_tensorflow():
    try:
        import tensorflow as tf  # noqa: PLC0415
    except ModuleNotFoundError as exc:
        raise SystemExit(
            "TensorFlow is not installed. Run: pip install -r requirements-ml.txt"
        ) from exc
    return tf


def require_opencv():
    try:
        import cv2  # noqa: PLC0415
    except ModuleNotFoundError as exc:
        raise SystemExit(
            "OpenCV is not installed. Run: pip install -r requirements-ml.txt"
        ) from exc
    return cv2


def get_class_folders(photo_dir: Path) -> list[Path]:
    if not photo_dir.exists():
        raise SystemExit(f"Photo folder not found: {photo_dir}")

    folders = sorted([folder for folder in photo_dir.iterdir() if folder.is_dir()], key=lambda item: item.name.lower())
    if len(folders) < 2:
        raise SystemExit("At least two student folders are required for training.")
    return folders


def student_label_from_folder(folder_name: str) -> str:
    return FOLDER_TO_STUDENT_NAME.get(folder_name.lower(), folder_name.strip().upper())


def prepare_face_dataset(photo_dir: Path, output_dir: Path) -> Path:
    cv2 = require_opencv()
    cascade_path = Path(cv2.data.haarcascades) / "haarcascade_frontalface_default.xml"
    face_detector = cv2.CascadeClassifier(str(cascade_path))
    if face_detector.empty():
        raise SystemExit(f"OpenCV face cascade could not load: {cascade_path}")

    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    copied = 0
    cropped = 0
    for class_folder in get_class_folders(photo_dir):
        target_folder = output_dir / class_folder.name
        target_folder.mkdir(parents=True, exist_ok=True)
        image_files = sorted([item for item in class_folder.iterdir() if item.is_file() and item.suffix.lower() in IMAGE_SUFFIXES])

        for index, image_path in enumerate(image_files, start=1):
            image = cv2.imread(str(image_path))
            if image is None:
                continue

            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            faces = face_detector.detectMultiScale(gray, scaleFactor=1.12, minNeighbors=4, minSize=(48, 48))
            output_image = image

            if len(faces):
                x, y, w, h = sorted(faces, key=lambda face: face[2] * face[3], reverse=True)[0]
                pad_x = int(w * 0.24)
                pad_y = int(h * 0.34)
                x1 = max(x - pad_x, 0)
                y1 = max(y - pad_y, 0)
                x2 = min(x + w + pad_x, image.shape[1])
                y2 = min(y + h + pad_y, image.shape[0])
                output_image = image[y1:y2, x1:x2]
                cropped += 1

            output_image = cv2.resize(output_image, (IMG_SIZE, IMG_SIZE), interpolation=cv2.INTER_AREA)
            output_path = target_folder / f"{image_path.stem}_{index:04d}.jpg"
            cv2.imwrite(str(output_path), output_image)
            copied += 1

    if copied == 0:
        raise SystemExit("No valid training images were found after OpenCV preprocessing.")

    print(f"OpenCV preprocessing complete: {cropped}/{copied} images cropped to detected faces.")
    return output_dir


def build_datasets(tf, photo_dir: Path, batch_size: int, validation_split: float):
    train_ds = tf.keras.utils.image_dataset_from_directory(
        photo_dir,
        labels="inferred",
        label_mode="int",
        validation_split=validation_split,
        subset="training",
        seed=42,
        image_size=(IMG_SIZE, IMG_SIZE),
        batch_size=batch_size,
        shuffle=True,
    )
    val_ds = tf.keras.utils.image_dataset_from_directory(
        photo_dir,
        labels="inferred",
        label_mode="int",
        validation_split=validation_split,
        subset="validation",
        seed=42,
        image_size=(IMG_SIZE, IMG_SIZE),
        batch_size=batch_size,
        shuffle=False,
    )

    folder_labels = list(train_ds.class_names)
    student_labels = [student_label_from_folder(name) for name in folder_labels]
    autotune = tf.data.AUTOTUNE
    return train_ds.prefetch(autotune), val_ds.prefetch(autotune), folder_labels, student_labels


def build_model(tf, class_count: int, learning_rate: float):
    inputs = tf.keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3), name="student_face")
    base_model = tf.keras.applications.EfficientNetB0(
        include_top=False,
        weights="imagenet",
        input_tensor=inputs,
    )
    base_model.trainable = False

    x = tf.keras.layers.GlobalAveragePooling2D()(base_model.output)
    x = tf.keras.layers.Dropout(0.28)(x)
    outputs = tf.keras.layers.Dense(class_count, activation="softmax", name="student_prediction")(x)
    model = tf.keras.Model(inputs, outputs, name="navyug_student_face_model")
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model, base_model


def fine_tune_model(tf, model, base_model, learning_rate: float):
    base_model.trainable = True
    for layer in base_model.layers[:-30]:
        layer.trainable = False
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )


def save_metadata(folder_labels: list[str], student_labels: list[str]):
    KERAS_OUTPUT_DIR.mkdir(exist_ok=True)
    TFJS_OUTPUT_DIR.mkdir(exist_ok=True)

    labels_data = {
        "folderLabels": folder_labels,
        "labels": student_labels,
        "imageSize": IMG_SIZE,
        "architecture": "EfficientNetB0",
    }
    (KERAS_OUTPUT_DIR / "labels.json").write_text(json.dumps(labels_data, indent=2), encoding="utf-8")

    metadata = {
        "modelName": "NAVYUG EfficientNetB0 Face Attendance",
        "labels": student_labels,
        "folderLabels": folder_labels,
        "imageSize": IMG_SIZE,
        "architecture": "EfficientNetB0",
        "threshold": 0.90,
    }
    (TFJS_OUTPUT_DIR / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")


def export_tfjs(keras_model_path: Path):
    converter = shutil.which("tensorflowjs_converter")
    if not converter:
        print("tensorflowjs_converter not found. Install tensorflowjs or run: pip install -r requirements-ml.txt")
        print(f"Keras model saved at: {keras_model_path}")
        return False

    TFJS_OUTPUT_DIR.mkdir(exist_ok=True)
    command = [
        converter,
        "--input_format=keras",
        str(keras_model_path),
        str(TFJS_OUTPUT_DIR),
    ]
    env = os.environ.copy()
    stub_path = PROJECT_ROOT / "tools" / "converter_stubs"
    env["PYTHONPATH"] = str(stub_path) + os.pathsep + env.get("PYTHONPATH", "")
    subprocess.run(command, check=True, env=env)
    return True


def main():
    args = parse_args()
    tf = require_tensorflow()
    tf.keras.utils.set_random_seed(42)
    dataset_dir = args.photo_dir if args.no_face_crop else prepare_face_dataset(args.photo_dir, CROPPED_PHOTO_DIR)

    folders = get_class_folders(dataset_dir)
    print("Training folders:")
    for folder in folders:
        count = len([item for item in folder.iterdir() if item.is_file()])
        print(f"  {folder.name}: {count} images -> {student_label_from_folder(folder.name)}")

    train_ds, val_ds, folder_labels, student_labels = build_datasets(
        tf,
        dataset_dir,
        args.batch_size,
        args.validation_split,
    )
    model, base_model = build_model(tf, len(student_labels), args.learning_rate)

    callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor="val_accuracy", patience=5, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.4, patience=2),
    ]

    model.fit(train_ds, validation_data=val_ds, epochs=args.epochs, callbacks=callbacks)

    if args.fine_tune_epochs > 0:
        fine_tune_model(tf, model, base_model, args.fine_tune_learning_rate)
        model.fit(train_ds, validation_data=val_ds, epochs=args.fine_tune_epochs, callbacks=callbacks)

    KERAS_OUTPUT_DIR.mkdir(exist_ok=True)
    keras_model_path = KERAS_OUTPUT_DIR / "navyug_face_model.h5"
    model.save(keras_model_path, include_optimizer=False)
    save_metadata(folder_labels, student_labels)

    print(f"Keras model saved: {keras_model_path}")
    if not args.skip_tfjs:
        exported = export_tfjs(keras_model_path)
        if exported:
            print(f"TensorFlow.js model exported to: {TFJS_OUTPUT_DIR}")
            print("Attendance page can now use model/model.json automatically.")


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as error:
        print("TensorFlow.js export failed.", file=sys.stderr)
        print(error, file=sys.stderr)
        sys.exit(error.returncode)
