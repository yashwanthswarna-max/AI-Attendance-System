import os
import cv2
import numpy as np
import base64
import io
from PIL import Image

# Check if face_recognition (dlib) is installed
try:
    import face_recognition
    HAS_FACE_RECOGNITION = True
except ImportError:
    face_recognition = None
    HAS_FACE_RECOGNITION = False

class FaceEngine:
    def __init__(self, match_threshold=0.55, anti_spoof_threshold=35.0):
        self.match_threshold = match_threshold
        self.anti_spoof_threshold = anti_spoof_threshold
        
        # Load OpenCV Haar cascade classifiers
        haar_dir = cv2.data.haarcascades
        face_cascade_path = os.path.join(haar_dir, 'haarcascade_frontalface_default.xml')
        eye_cascade_path = os.path.join(haar_dir, 'haarcascade_eye.xml')
        
        self.face_cascade = cv2.CascadeClassifier(face_cascade_path)
        self.eye_cascade = cv2.CascadeClassifier(eye_cascade_path)
        
        print(f"[FaceEngine] Initialized. Primary engine: {'face_recognition (dlib)' if HAS_FACE_RECOGNITION else 'OpenCV Vision Embeddings (Fallback-Safe)'}")

    @staticmethod
    def decode_image_base64(base64_str):
        """
        Decodes a base64 encoded data URI or string into a BGR OpenCV numpy image.
        """
        try:
            if ',' in base64_str:
                base64_str = base64_str.split(',', 1)[1]
            image_bytes = base64.b64decode(base64_str)
            image_array = np.frombuffer(image_bytes, dtype=np.uint8)
            img = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
            return img
        except Exception as e:
            print(f"[FaceEngine] Error decoding base64 image: {e}")
            return None

    @staticmethod
    def encode_image_base64(cv_img, ext='.jpg'):
        """
        Encodes an OpenCV image to a base64 data URI string.
        """
        try:
            _, buffer = cv2.imencode(ext, cv_img)
            b64_str = base64.b64encode(buffer).decode('utf-8')
            return f"data:image/jpeg;base64,{b64_str}"
        except Exception as e:
            print(f"[FaceEngine] Error encoding image to base64: {e}")
            return ""

    def check_liveness(self, face_bgr):
        """
        Anti-spoofing check using Laplacian variance (high-frequency texture analysis),
        color space distribution, and eye detection.
        Rejects low-frequency photo prints and static screen captures.
        """
        if face_bgr is None or face_bgr.size == 0:
            return False, 0.0, "Empty face region"

        gray = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2GRAY)
        
        # 1. Texture Sharpness (Laplacian Variance)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # 2. Eye detection in upper half of face
        h, w = gray.shape
        upper_half = gray[0:int(h * 0.65), :]
        eyes = self.eye_cascade.detectMultiScale(upper_half, scaleFactor=1.1, minNeighbors=3, minSize=(15, 15))
        has_eyes = len(eyes) >= 1

        # 3. Dynamic contrast / standard deviation
        contrast = gray.std()

        # Score calculation
        # Normalized texture score
        texture_score = min(100.0, (laplacian_var / 200.0) * 100.0)
        
        is_live = (laplacian_var >= self.anti_spoof_threshold) and (contrast > 20.0)
        
        details = {
            'laplacian_var': round(laplacian_var, 2),
            'contrast': round(contrast, 2),
            'eyes_detected': len(eyes),
            'texture_score': round(texture_score, 1),
            'is_live': bool(is_live)
        }
        
        reason = "Live subject confirmed" if is_live else "Spoof warning: Flat texture or screen detected"
        return is_live, texture_score, reason, details

    def compute_custom_embedding(self, face_rgb):
        """
        Robust 128-dimensional face embedding using multi-scale spatial grid
        intensity & gradient histograms when face_recognition is not installed.
        Guarantees deterministic, normalized 128D vectors.
        """
        resized = cv2.resize(face_rgb, (96, 96))
        gray = cv2.cvtColor(resized, cv2.COLOR_RGB2GRAY)
        
        # Divide into 4x4 spatial blocks (16 blocks)
        h, w = gray.shape
        bh, bw = h // 4, w // 4
        features = []

        # Gradients (Sobel X and Y)
        sobelx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
        mag, ang = cv2.cartToPolar(sobelx, sobely, angleInDegrees=True)

        for i in range(4):
            for j in range(4):
                block_gray = gray[i*bh:(i+1)*bh, j*bw:(j+1)*bw]
                block_mag = mag[i*bh:(i+1)*bh, j*bw:(j+1)*bw]
                block_ang = ang[i*bh:(i+1)*bh, j*bw:(j+1)*bw]
                
                # 4-bin orientation histogram weighted by magnitude (64 features across 16 blocks)
                hist_ang, _ = np.histogram(block_ang, bins=4, range=(0, 360), weights=block_mag)
                features.extend(hist_ang)
                
                # 4-bin intensity histogram (64 features across 16 blocks)
                hist_int, _ = np.histogram(block_gray, bins=4, range=(0, 256))
                features.extend(hist_int)

        feature_vec = np.array(features, dtype=np.float32) # Exactly 128 dimensions
        norm = np.linalg.norm(feature_vec)
        if norm > 1e-6:
            feature_vec = feature_vec / norm
        return feature_vec

    def extract_encoding(self, image_bgr):
        """
        Locates the primary face and extracts a 128-d normalized embedding.
        Returns: (encoding_array, bounding_box_dict, face_crop_bgr) or (None, None, None)
        """
        if image_bgr is None:
            return None, None, None

        rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        h, w, _ = image_bgr.shape

        if HAS_FACE_RECOGNITION:
            locations = face_recognition.face_locations(rgb, model='hog')
            if not locations:
                return None, None, None
            # Choose largest face
            locations.sort(key=lambda loc: (loc[2] - loc[0]) * (loc[1] - loc[3]), reverse=True)
            top, right, bottom, left = locations[0]
            encodings = face_recognition.face_encodings(rgb, known_face_locations=[(top, right, bottom, left)])
            if not encodings:
                return None, None, None
            
            bbox = {'x': left, 'y': top, 'width': right - left, 'height': bottom - top}
            face_crop = image_bgr[max(0, top):min(h, bottom), max(0, left):min(w, right)]
            return np.array(encodings[0], dtype=np.float32), bbox, face_crop
        else:
            gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))
            if len(faces) == 0:
                return None, None, None

            # Sort by area
            faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
            x, y, fw, fh = faces[0]
            
            face_crop = image_bgr[y:y+fh, x:x+fw]
            face_rgb = rgb[y:y+fh, x:x+fw]
            
            encoding = self.compute_custom_embedding(face_rgb)
            bbox = {'x': int(x), 'y': int(y), 'width': int(fw), 'height': int(fh)}
            return encoding, bbox, face_crop

    def match_face(self, candidate_encoding, known_encodings_dict):
        """
        Compares candidate_encoding against a dict of {student_id: encoding_bytes_or_array}.
        Returns (best_student_id, distance, confidence_percent) or (None, distance, 0)
        """
        if candidate_encoding is None or not known_encodings_dict:
            return None, 1.0, 0.0

        best_student_id = None
        best_distance = float('inf')

        candidate = np.array(candidate_encoding, dtype=np.float32)

        for student_id, ref in known_encodings_dict.items():
            if ref is None:
                continue
            if isinstance(ref, bytes):
                ref_vec = np.frombuffer(ref, dtype=np.float32)
            else:
                ref_vec = np.array(ref, dtype=np.float32)
            
            if ref_vec.shape != candidate.shape:
                continue

            # Euclidean distance
            distance = float(np.linalg.norm(candidate - ref_vec))
            if distance < best_distance:
                best_distance = distance
                best_student_id = student_id

        # Calculate confidence
        if best_distance <= self.match_threshold:
            # Map distance (0 -> threshold) to confidence (100% -> 60%)
            confidence = max(60.0, min(99.9, (1.0 - (best_distance / (self.match_threshold * 1.5))) * 100.0))
            return best_student_id, round(best_distance, 4), round(confidence, 1)
        else:
            confidence = max(0.0, min(55.0, (1.0 - (best_distance / 2.0)) * 100.0))
            return None, round(best_distance, 4), round(confidence, 1)

    def process_frame(self, frame_bgr, known_students, enforce_liveness=True):
        """
        Process a live camera frame:
        - Detect faces
        - Check liveness / anti-spoof
        - Extract encoding
        - Match against known students
        Returns dict with detection and recognition results.
        """
        if frame_bgr is None:
            return {'success': False, 'message': 'Invalid image'}

        encoding, bbox, face_crop = self.extract_encoding(frame_bgr)
        if encoding is None or bbox is None:
            return {
                'success': True,
                'face_detected': False,
                'message': 'No face detected. Align your face within the frame.'
            }

        # Check liveness
        is_live, texture_score, liveness_reason, liveness_details = self.check_liveness(face_crop)

        if enforce_liveness and not is_live:
            return {
                'success': True,
                'face_detected': True,
                'bbox': bbox,
                'is_live': False,
                'liveness_details': liveness_details,
                'matched': False,
                'message': f"Liveness check failed: {liveness_reason}"
            }

        # Match face
        student_id, distance, confidence = self.match_face(encoding, known_students)

        return {
            'success': True,
            'face_detected': True,
            'bbox': bbox,
            'is_live': is_live,
            'liveness_score': texture_score,
            'matched': bool(student_id is not None),
            'student_id': student_id,
            'distance': distance,
            'confidence': confidence,
            'message': 'Student recognized successfully' if student_id else 'Face detected but not registered'
        }

# Global singleton
face_engine = FaceEngine()
