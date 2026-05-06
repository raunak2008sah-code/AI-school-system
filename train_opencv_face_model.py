"""Train a simple OpenCV/KNN face recognizer from the NAVYUG photo folder.

This is adapted from the reference project at:
C:/Users/acer/Downloads/face_recognition_project-main/face_recognition_project-main

It does not replace the browser TensorFlow.js model. It creates a lightweight
Python/OpenCV model that is useful for demo comparison and future desktop
attendance scripts.
"""

from __future__ import annotations

import json
import pickle
from pathlib import Path

import cv2
import numpy as np
from sklearn.neighbors import KNeighborsClassifier

from train_face_model import FOLDER_TO_STUDENT_NAME, PHOTO_DIR, PROJECT_ROOT


OUTPUT_DIR = PROJECT_ROOT / "trained_model" / "opencv_knn"
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
FACE_SIZE = (50, 50)


def label_from_folder(folder_name: str) -> str:
    return FOLDER_TO_STUDENT_NAME.get(folder_name.lower(), folder_name.strip().upper())


def iter_image_files(photo_dir: Path):
    for folder in sorted([item for item in photo_dir.iterdir() if item.is_dir()], key=lambda item: item.name.lower()):
        label = label_from_folder(folder.name)
        for image_path in sorted(folder.iterdir()):
            if image_path.is_file() and image_path.suffix.lower() in IMAGE_SUFFIXES:
                yield label, image_path


def crop_largest_face(face_detector, image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = face_detector.detectMultiScale(gray, scaleFactor=1.18, minNeighbors=4, minSize=(48, 48))
    if len(faces) == 0:
        return image

    x, y, w, h = sorted(faces, key=lambda face: face[2] * face[3], reverse=True)[0]
    pad_x = int(w * 0.2)
    pad_y = int(h * 0.28)
    x1 = max(x - pad_x, 0)
    y1 = max(y - pad_y, 0)
    x2 = min(x + w + pad_x, image.shape[1])
    y2 = min(y + h + pad_y, image.shape[0])
    return image[y1:y2, x1:x2]


def main():
    if not PHOTO_DIR.exists():
        raise SystemExit(f"Photo folder not found: {PHOTO_DIR}")

    cascade_path = Path(cv2.data.haarcascades) / "haarcascade_frontalface_default.xml"
    face_detector = cv2.CascadeClassifier(str(cascade_path))
    if face_detector.empty():
        raise SystemExit(f"Could not load Haar cascade: {cascade_path}")

    faces = []
    labels = []
    per_student = {}

    for label, image_path in iter_image_files(PHOTO_DIR):
        image = cv2.imread(str(image_path))
        if image is None:
            continue

        face = crop_largest_face(face_detector, image)
        resized = cv2.resize(face, FACE_SIZE, interpolation=cv2.INTER_AREA)
        faces.append(resized.flatten())
        labels.append(label)
        per_student[label] = per_student.get(label, 0) + 1

    if len(set(labels)) < 2:
        raise SystemExit("At least two students are required to train the OpenCV/KNN model.")
    if not faces:
        raise SystemExit("No valid face images found.")

    x_train = np.asarray(faces, dtype=np.uint8)
    y_train = np.asarray(labels)
    model = KNeighborsClassifier(n_neighbors=5, weights="distance")
    model.fit(x_train, y_train)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with (OUTPUT_DIR / "knn_face_model.pkl").open("wb") as file:
        pickle.dump(model, file)
    with (OUTPUT_DIR / "faces.pkl").open("wb") as file:
        pickle.dump(x_train, file)
    with (OUTPUT_DIR / "labels.pkl").open("wb") as file:
        pickle.dump(labels, file)

    metadata = {
        "model": "OpenCV Haar Cascade + KNN",
        "faceSize": FACE_SIZE,
        "totalSamples": len(labels),
        "students": per_student,
    }
    (OUTPUT_DIR / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    print("OpenCV/KNN face model trained.")
    print(f"Students: {len(per_student)}")
    print(f"Samples: {len(labels)}")
    print(f"Output: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
