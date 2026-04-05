import cv2
import face_recognition
import numpy as np
import sys
import os
from encoded import encoded_face_train, classNames

def verify_face(target_username, captured_image_path):
    if not os.path.exists(captured_image_path):
        print("Error: Captured image not found")
        return

    # Load the captured image
    img = cv2.imread(captured_image_path)
    if img is None:
        print("Error: Could not read captured image")
        return

    # Resize and convert to RGB (standard face_recognition processing)
    imgS = cv2.resize(img, (0,0), None, 0.25, 0.25)
    imgS = cv2.cvtColor(imgS, cv2.COLOR_BGR2RGB)

    # Find faces in the captured image
    faces_in_frame = face_recognition.face_locations(imgS)
    encoded_faces = face_recognition.face_encodings(imgS, faces_in_frame)

    for encode_face in encoded_faces:
        # Compare with the trained database
        matches = face_recognition.compare_faces(encoded_face_train, encode_face)
        faceDist = face_recognition.face_distance(encoded_face_train, encode_face)
        
        if len(faceDist) > 0:
            matchIndex = np.argmin(faceDist)
            if matches[matchIndex]:
                matched_username = classNames[matchIndex]
                # Check if the matched face belongs to the expected user
                if matched_username == target_username:
                    print("Match")
                    return

    print("Mismatch")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python fr.py <username> <captured_image_path>")
    else:
        username = sys.argv[1]
        image_path = sys.argv[2]
        verify_face(username, image_path)
