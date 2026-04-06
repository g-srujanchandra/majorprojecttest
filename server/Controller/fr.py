import cv2
import face_recognition
import numpy as np
import sys
import os

# 🚀 DYNAMIC 1-to-1 BIO-VERIFICATION ENGINE
# Upgraded for Cloud Deployment (No more static databases)
# This script directly compares the live login photo against the registered Voter ID photo.

def verify_face(target_username, live_photo_path, registered_photo_path):
    # 1. Validation
    if not os.path.exists(live_photo_path):
        print(f"Error: Live photo not found at {live_photo_path}")
        return
    if not os.path.exists(registered_photo_path):
        print(f"Error: Registered Voter photo not found at {registered_photo_path}")
        return

    try:
        # 2. Load and Encode the REGISTERED Photo (The Truth)
        # 🏎️ AUTO-OPTIMIZE: Load and process at a smaller scale for speed
        reg_img = face_recognition.load_image_file(registered_photo_path)
        
        # Shrink image to 1/2 size if it's too large to prevent cloud timeouts
        if reg_img.shape[1] > 800:
             reg_img = cv2.resize(reg_img, (0,0), fx=0.5, fy=0.5)
        
        reg_encodings = face_recognition.face_encodings(reg_img)
        
        if len(reg_encodings) == 0:
            print("Error: Could not extract features from the REGISTERED photo. Try re-uploading ID.")
            return
        
        known_encoding = reg_encodings[0]

        # 3. Load and Encode the LIVE Photo (The Login Attempt)
        live_img = face_recognition.load_image_file(live_photo_path)
        
        # Shrink image for speed
        if live_img.shape[1] > 800:
             live_img = cv2.resize(live_img, (0,0), fx=0.5, fy=0.5)

        live_encodings = face_recognition.face_encodings(live_img)

        if len(live_encodings) == 0:
            print("Mismatch: No face found in the LIVE login attempt.")
            return

        # 4. Compare faces (1-to-1)
        # Tolerance 0.5 is strict, 0.6 is standard (Default is 0.6)
        results = face_recognition.compare_faces([known_encoding], live_encodings[0], tolerance=0.55)
        
        if results[0]:
            print("Match")
        else:
            # Also check the distance for logging
            dist = face_recognition.face_distance([known_encoding], live_encodings[0])
            print(f"Mismatch: Distance {dist[0]:.4f} (Required < 0.55)")

    except Exception as e:
        print(f"Engine Exception: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python fr.py <username> <live_photo_path> <registered_photo_path>")
    else:
        username = sys.argv[1]
        live_path = sys.argv[2]
        reg_path = sys.argv[3]
        verify_face(username, live_path, reg_path)
