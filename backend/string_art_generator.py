# backend/string_art_generator.py
import numpy as np
import math
from PIL import Image, ImageFilter # Added Image and ImageFilter

def get_nail_coordinates(num_nails, image_size_square):
    """Calculates coordinates for nails placed in a circle on a square image."""
    center_x = image_size_square / 2
    center_y = image_size_square / 2
    radius = image_size_square / 2 * 0.9  # 90% of half size to keep nails within image

    nails = []
    for i in range(num_nails):
        angle = 2 * math.pi * i / num_nails
        x = center_x + radius * math.cos(angle)
        y = center_y + radius * math.sin(angle)
        nails.append((int(round(x)), int(round(y))))
    return nails

def get_line_pixels(p1, p2, max_dim):
    """
    Get all pixel coordinates between p1 and p2 using Bresenham's line algorithm.
    Ensures coordinates are within (0, max_dim-1).
    p1, p2 are tuples (x, y)
    """
    x1, y1 = p1
    x2, y2 = p2
    pixels = []
    dx = abs(x2 - x1)
    dy = abs(y2 - y1)
    sx = 1 if x1 < x2 else -1
    sy = 1 if y1 < y2 else -1
    err = dx - dy

    while True:
        # Clamp coordinates to be within image boundaries
        clamped_x = max(0, min(max_dim - 1, x1))
        clamped_y = max(0, min(max_dim - 1, y1))
        pixels.append((clamped_x, clamped_y))

        if x1 == x2 and y1 == y2:
            break
        
        e2 = 2 * err
        if e2 > -dy:
            err -= dy
            x1 += sx
        if e2 < dx:
            err += dx
            y1 += sy
    return list(set(pixels)) # Return unique pixels

def calculate_line_darkness(image_array, p1, p2, max_dim):
    """Calculates the sum of pixel values along the line between p1 and p2."""
    pixels_on_line = get_line_pixels(p1, p2, max_dim)
    darkness = 0
    for x, y in pixels_on_line:
        darkness += image_array[y, x] # Accessing NumPy array as [row, col] which is [y, x]
    return darkness / len(pixels_on_line) if pixels_on_line else 0


def generate_art(image_array, num_nails, num_lines):
    """
    Generates the string art path.
    image_array: Grayscale numpy array (darker pixels have lower values).
    We want to find lines that cover dark areas.
    So, we can invert the image or subtract from max value.
    Let's assume higher values are 'darker' for the algorithm.
    If original image has dark as 0 and white as 255, invert it.
    """
    
    # Convert input numpy array to PIL Image
    # (Assuming image_array is the grayscaled, contrast-enhanced image from app.py)
    img_pil = Image.fromarray(image_array.astype(np.uint8), mode='L')

    # 1. Apply Gaussian Blur
    # A small radius is often good for edge detection preprocessing.
    # Radius 1 is a good starting point. If edges are too noisy, try a slightly larger radius.
    # If edges are too smooth and weak, try a smaller radius like 0.5 or remove blur.
    blurred_img = img_pil.filter(ImageFilter.GaussianBlur(radius=1)) 
    # print("Applied Gaussian Blur to the image for edge detection.") # Optional: for debugging

    # 2. Apply Sobel operator manually for X and Y gradients
    # These kernels detect changes in intensity along X and Y directions.
    sobel_x_kernel = ImageFilter.Kernel((3,3), [-1,0,1,-2,0,2,-1,0,1], 1, 0)
    sobel_y_kernel = ImageFilter.Kernel((3,3), [-1,-2,-1,0,0,0,1,2,1], 1, 0)

    img_sobel_x = blurred_img.filter(sobel_x_kernel)
    img_sobel_y = blurred_img.filter(sobel_y_kernel)

    # Convert PIL images of gradients to NumPy arrays for calculation
    np_sobel_x = np.array(img_sobel_x, dtype=np.float32)
    np_sobel_y = np.array(img_sobel_y, dtype=np.float32)

    # 3. Calculate Gradient Magnitude
    # np.hypot calculates sqrt(x^2 + y^2), which is the magnitude of the gradient.
    # This represents the strength of the edge.
    gradient_magnitude = np.hypot(np_sobel_x, np_sobel_y)

    # 4. Normalize the gradient magnitude to the 0-255 range
    # This ensures that the edge strength is represented consistently.
    max_grad_val = np.max(gradient_magnitude)
    if max_grad_val > 0:
        # Scale values to 0-1, then multiply by 255
        gradient_magnitude = (gradient_magnitude / max_grad_val) * 255.0
    
    # Convert the final processed image to uint8, as expected by subsequent parts of the code.
    processed_image = gradient_magnitude.astype(np.uint8)
    
    # Diagnostic prints (updated)
    print(f"Max pixel value in normalized Sobel edge image: {np.max(processed_image)}")
    unique_vals, counts = np.unique(processed_image, return_counts=True)
    # Print only a sample of unique values if there are too many, for brevity
    sample_size = min(10, len(unique_vals))
    print(f"Unique values in Sobel edge image (sample of {sample_size}): {unique_vals[:sample_size]} with counts {counts[:sample_size]}")

    image_size = processed_image.shape[0] # Should be same as image_array.shape[0]
    nail_coords = get_nail_coordinates(num_nails, image_size)
    
    current_nail_idx = 0
    path = [current_nail_idx]
    
    # Create a mask for lines already drawn to reduce their score
    line_mask = np.ones_like(processed_image, dtype=float)

    for line_num in range(num_lines):
        best_next_nail_idx = -1
        max_darkness = -float('inf')

        for next_nail_candidate_idx in range(num_nails):
            if next_nail_candidate_idx == current_nail_idx:
                continue # Don't connect to self

            # Optional: Avoid immediate backtracking if path has at least 2 points
            if len(path) > 1 and next_nail_candidate_idx == path[-2]:
                continue

            p1 = nail_coords[current_nail_idx]
            p2 = nail_coords[next_nail_candidate_idx]
            
            # Calculate darkness considering the mask
            pixels_on_line = get_line_pixels(p1, p2, image_size)
            current_line_darkness = 0
            if pixels_on_line:
                for x,y in pixels_on_line:
                    current_line_darkness += processed_image[y,x] * line_mask[y,x]
                current_line_darkness /= len(pixels_on_line)

            if current_line_darkness > max_darkness:
                max_darkness = current_line_darkness
                best_next_nail_idx = next_nail_candidate_idx
        
        if best_next_nail_idx == -1: # No valid line found (should not happen ideally)
            # Fallback: pick any nail not the current one
            best_next_nail_idx = (current_nail_idx + 1) % num_nails 
            if best_next_nail_idx == current_nail_idx: # If only one nail, this could be an issue
                 best_next_nail_idx = (current_nail_idx + 2) % num_nails if num_nails > 1 else 0


        # "Draw" the line by reducing scores on the mask
        chosen_p1 = nail_coords[current_nail_idx]
        chosen_p2 = nail_coords[best_next_nail_idx]
        pixels_on_chosen_line = get_line_pixels(chosen_p1, chosen_p2, image_size)
        for x,y in pixels_on_chosen_line:
            line_mask[y,x] *= 0.6 # Adjusted masking factor

        current_nail_idx = best_next_nail_idx
        path.append(current_nail_idx)
        
        if (line_num + 1) % 100 == 0: # Log progress
            print(f"Generated line {line_num + 1}/{num_lines}")

    return path
