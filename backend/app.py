from flask import Flask, request, jsonify
from flask_cors import CORS # Import CORS
from PIL import Image, ImageOps, ImageEnhance, ImageFilter # Ensured ImageEnhance and ImageFilter
import numpy as np
import io
import os

# Add this import:
from string_art_generator import generate_art

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Ensure the instance folder exists (Flask might need it for sessions, etc.)
try:
    os.makedirs(app.instance_path)
except OSError:
    pass

@app.route('/api/generate_string_art', methods=['POST'])
def generate_string_art_route(): # Renamed to avoid conflict with imported function
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400
    
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({"error": "No image selected"}), 400

    try:
        nail_count = int(request.form.get('nail_count', 100))
        line_count = int(request.form.get('line_count', 500))
    except ValueError:
        return jsonify({"error": "Invalid nail_count or line_count"}), 400

    try:
        img_byte_arr = io.BytesIO()
        file.save(img_byte_arr) # Save file stream to a BytesIO object
        img_byte_arr.seek(0) # Reset stream position
        
        img = Image.open(img_byte_arr)

        # 1. Ensure grayscale (it should already be, but let's be sure)
        img = img.convert('L')

        # 2. Resize to a standard dimension
        standard_size = (300, 300)
        img = img.resize(standard_size, Image.Resampling.LANCZOS)

        # --- Foreground Isolation Logic ---
        # Preserve the original grayscaled image for final composition
        original_grayscaled_img = img.copy()
        app.logger.info("Original grayscaled image preserved for masking.")

        # 1. Aggressive Contrast Enhancement (on a copy, for mask generation)
        img_for_mask = img.copy()
        enhancer = ImageEnhance.Contrast(img_for_mask)
        img_for_mask = enhancer.enhance(2.5) # Increased factor slightly
        app.logger.info("Applied strong contrast enhancement for mask generation.")

        # 2. Create a Binary Mask using Thresholding
        img_for_mask = img_for_mask.convert('L') # Ensure grayscale for thresholding
        threshold_value = 200 
        mask = img_for_mask.point(lambda x: 255 if x > threshold_value else 0, '1')
        app.logger.info(f"Created binary mask with threshold {threshold_value}.")

        # Optional: Save mask for debugging
        # if app.debug:
        #    mask_path = os.path.join(app.instance_path, "debug_mask.png")
        #    mask.save(mask_path)
        #    app.logger.info(f"Debug mask saved to {mask_path}")

        # 3. Apply the Mask to the Original Grayscaled Image
        black_bg = Image.new('L', original_grayscaled_img.size, 0)
        img_masked = Image.composite(original_grayscaled_img, black_bg, mask)
        app.logger.info("Applied mask to original grayscaled image, suppressing background.")
        
        # Optional: Save masked image for debugging
        # if app.debug:
        #    masked_image_path = os.path.join(app.instance_path, "debug_masked_image.png")
        #    img_masked.save(masked_image_path)
        #    app.logger.info(f"Debug masked image saved to {masked_image_path}")

        img = img_masked # Update 'img' to be this new masked image
        # --- End of Foreground Isolation Logic ---
            
            img_array = np.array(img) # Now this array is from the foreground-isolated image
            
            app.logger.info(f"Image processed for generation (post-masking): mode={img.mode}, size={img.size}, nail_count={nail_count}, line_count={line_count}")

            # Generate the string art path
            # Note: generate_art expects image_array where darker pixels have lower values
            # The function itself inverts it, so we pass the direct output of Pillow's 'L' mode.
            nail_path_list = generate_art(img_array, nail_count, line_count)
            
            nail_path_str = "-".join(map(str, nail_path_list))
            
            app.logger.info(f"Generated path: {nail_path_str[:100]}...") # Log a snippet

            return jsonify({
                "message": "String art generated successfully.",
                "nail_path": nail_path_str,
                "processed_image_shape": img_array.shape
            })

    except Exception as e:
        app.logger.error(f"Error in string art generation: {e}", exc_info=True)
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
