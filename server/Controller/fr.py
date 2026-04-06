import face_recognition
import sys
import os

# 🛡️ STABLE 1-to-1 BIO-VERIFICATION ENGINE
# Re-configured for maximum cloud stability (No CV2 dependency)

def verify_face(target_username, live_photo_path, registered_photo_path):
    # 1. Validation
    if not os.path.exists(live_photo_path):
        print(f"Error: Live photo not found")
        return
    if not os.path.exists(registered_photo_path):
        print(f"Error: Registered Voter photo not found")
        return

    try:
        # 2. Load and Encode the REGISTERED Photo
        # Using standard face_recognition loading which is more stable
        reg_img = face_recognition.load_image_file(registered_photo_path)
        reg_encodings = face_recognition.face_encodings(reg_img)
        
        if len(reg_encodings) == 0:
            print("Error: No face found in registration record.")
            return
        
        known_encoding = reg_encodings[0]

        # 3. Load and Encode the LIVE Photo
        live_img = face_recognition.load_image_file(live_photo_path)
        live_encodings = face_recognition.face_encodings(live_img)

        if len(live_encodings) == 0:
            print("Mismatch: No face found in search.")
            return

        # 4. Compare faces (1-to-1)
        results = face_recognition.compare_faces([known_encoding], live_encodings[0], tolerance=0.58)
        
        if results[0]:
            print("Match")
        else:
            print("Mismatch")

    except Exception as e:
        print(f"Engine Error: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python fr.py <username> <live_photo_path> <registered_photo_path>")
    else:
        username = sys.argv[1]
        live_path = sys.argv[2]
        reg_path = sys.argv[3]
        verify_face(username, live_path, reg_path)
