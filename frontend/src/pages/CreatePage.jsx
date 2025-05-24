// frontend/src/pages/CreatePage.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import axios from 'axios'; // Import axios

// (toGrayscale function can remain similar or be removed if backend handles all)
// For this iteration, the frontend already provides a grayscaled, cropped image.

const previewCanvasSize = 300; // Or make it responsive

function CreatePage() {
  const [imgSrc, setImgSrc] = useState(null); // Original selected image (data URL)
  const [crop, setCrop] = useState(); // Current crop parameters
  const [completedCrop, setCompletedCrop] = useState(null); // The final crop
  const imgRef = useRef(null); // Ref to the <img /> displaying the source for cropping
  const previewCroppedCanvasRef = useRef(null); // Ref to canvas showing the cropped grayscaled image

  const [nailCount, setNailCount] = useState(200);
  const [lineCount, setLineCount] = useState(1000);

  // API and Preview State
  const [generatedPath, setGeneratedPath] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // True when waiting for backend
  const [isAnimating, setIsAnimating] = useState(false); // True when frontend is animating the preview
  const [apiError, setApiError] = useState(null);
  
  const [previewNailCoords, setPreviewNailCoords] = useState([]);
  const [drawnLines, setDrawnLines] = useState([]); // Stores {from: nailIdx, to: nailIdx}
  const [progressPercentage, setProgressPercentage] = useState(0);
  const stringArtPreviewCanvasRef = useRef(null); // Canvas for final string art animation


  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        // Grayscale conversion
        const tempImg = new Image();
        tempImg.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = tempImg.width;
            canvas.height = tempImg.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(tempImg, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = avg; data[i + 1] = avg; data[i + 2] = avg;
            }
            ctx.putImageData(imageData, 0, 0);
            setImgSrc(canvas.toDataURL('image/png')); // This is grayscaled
        };
        tempImg.src = reader.result?.toString() || '';
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener('load', () => {
         if (reader.result) {
            const tempImg = new Image();
            tempImg.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = tempImg.width;
                canvas.height = tempImg.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(tempImg, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = avg; data[i + 1] = avg; data[i + 2] = avg;
                }
                ctx.putImageData(imageData, 0, 0);
                setImgSrc(canvas.toDataURL('image/png'));
            };
            tempImg.src = reader.result?.toString() || '';
        }
      });
      reader.readAsDataURL(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };

  const onImageLoad = useCallback((e) => {
    imgRef.current = e.currentTarget;
    const { width, height } = e.currentTarget;
    const newCrop = centerCrop(makeAspectCrop({ unit: '%', width: 90 }, 1, width, height), width, height);
    setCrop(newCrop);
    // Draw the full grayscaled image onto the previewCroppedCanvasRef initially
    // This will be updated by the ReactCrop's output later
    if (previewCroppedCanvasRef.current && imgSrc) {
        const canvas = previewCroppedCanvasRef.current;
        const ctx = canvas.getContext('2d');
        const image = new Image();
        image.onload = () => {
            // canvas.width = image.width; // Set canvas size if needed, or fixed size
            // canvas.height = image.height;
            // For simplicity, let's assume fixed size for this canvas for now or scale it
            // ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        }
        image.src = imgSrc; // imgRef.current.src which is already grayscaled
    }

    return false;
  }, [imgSrc]);

  // Effect to draw the cropped image to the previewCroppedCanvasRef
  useEffect(() => {
    if (!completedCrop || !previewCroppedCanvasRef.current || !imgRef.current) {
      return;
    }
    const image = imgRef.current; // This is the <img/> element (grayscaled)
    const canvas = previewCroppedCanvasRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    // Adjust for device pixel ratio for sharpness
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = completedCrop.width * scaleX * pixelRatio;
    canvas.height = completedCrop.height * scaleY * pixelRatio;
    canvas.style.width = `${completedCrop.width * scaleX}px`;
    canvas.style.height = `${completedCrop.height * scaleY}px`;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image, // Source is already grayscaled
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX, // Draw on canvas at its actual pixel size
      completedCrop.height * scaleY
    );
  }, [completedCrop]);


  const handleGenerateArt = async () => {
    if (!completedCrop || !previewCroppedCanvasRef.current) {
      alert('Please select and crop an image first.');
      return;
    }

    setIsLoading(true); // Start backend loading
    setIsAnimating(false); // Reset animation state
    setApiError(null);
    setGeneratedPath(null);
    setDrawnLines([]);
    setProgressPercentage(0);
    setPreviewNailCoords([]);

    previewCroppedCanvasRef.current.toBlob(async (blob) => {
      if (!blob) {
        setApiError('Could not get image data for upload.');
        setIsLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append('image', blob, 'cropped_image.png');
      formData.append('nail_count', nailCount.toString());
      formData.append('line_count', lineCount.toString());

      try {
        const response = await axios.post('http://localhost:5001/api/generate_string_art', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setGeneratedPath(response.data.nail_path);
        // setIsLoading(false); // Backend loading done
        // setIsAnimating(true); // Animation will start via useEffect
      } catch (err) {
        setApiError(err.response?.data?.error || 'Failed to generate string art.');
        console.error(err);
        setIsLoading(false); // Stop loading on error
      } 
      // Removed finally block for setIsLoading(false) here, 
      // it's handled after animation or if generatedPath is not set.
    }, 'image/png');
  };
  
  // Effect for animating the string art drawing
  useEffect(() => {
    if (!generatedPath || !stringArtPreviewCanvasRef.current) {
      setIsLoading(false); // Ensure loading stops if path is invalid or missing
      setIsAnimating(false);
      return;
    }
    
    setIsLoading(false); // Backend has responded, path is available
    setIsAnimating(true); // Start animation phase

    const pathIndices = generatedPath.split('-').map(val => parseInt(val, 10)); // Ensure base 10
    if (pathIndices.length < 2) {
        setIsAnimating(false); // Not enough points to animate
        setProgressPercentage(100); // Or 0, depending on desired outcome for invalid path
        return;
    }

    // Calculate nail coordinates for the preview canvas
    const canvas = stringArtPreviewCanvasRef.current;
    const center_x = canvas.width / 2;
    const center_y = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 2 * 0.9;
    const localNailCoords = [];
    for (let i = 0; i < nailCount; i++) {
      const angle = (2 * Math.PI * i) / nailCount - Math.PI / 2; // Start from top
      const x = center_x + radius * Math.cos(angle);
      const y = center_y + radius * Math.sin(angle);
      localNailCoords.push({ x, y });
    }
    setPreviewNailCoords(localNailCoords);

    let currentLine = 0;
    const linesToDraw = [];
    if (pathIndices.length >= 2) {
      for (let i = 0; i < pathIndices.length - 1; i++) {
        const fromNail = pathIndices[i];
        const toNail = pathIndices[i+1];
        // Check if indices are valid numbers and within bounds
        if (!isNaN(fromNail) && !isNaN(toNail) && 
            fromNail >= 0 && fromNail < nailCount &&
            toNail >= 0 && toNail < nailCount) {
          linesToDraw.push({ from: fromNail, to: toNail });
        } else {
          console.warn(`Invalid nail index found in path: from ${fromNail}, to ${toNail}. Skipping line.`);
        }
      }
    }

    if (linesToDraw.length === 0) {
        setIsAnimating(false); // No valid lines to draw
        setProgressPercentage(100); // Consider this "complete" if no lines
        return;
    }

    function animate() {
      if (currentLine < linesToDraw.length) {
        setDrawnLines(prev => [...prev, linesToDraw[currentLine]]);
        setProgressPercentage(Math.round(((currentLine + 1) / linesToDraw.length) * 100));
        currentLine++;
        setTimeout(animate, 20); // Adjust delay for animation speed
      } else {
        setProgressPercentage(100); // Ensure it hits 100%
        setIsAnimating(false); // Animation finished
      }
    }
    animate();
    
    // Cleanup function in case component unmounts or dependencies change mid-animation
    return () => {
        // Potentially clear any running timeouts if animate used a timeoutRef
        // For this simple setTimeout, it might not be strictly necessary unless animations are very long
        // or component re-renders frequently with changing generatedPath/nailCount.
    };

  }, [generatedPath, nailCount]); // Rerun if nailCount changes for new coords

  // Effect for drawing on stringArtPreviewCanvasRef
  useEffect(() => {
    const canvas = stringArtPreviewCanvasRef.current;
    if (!canvas || previewNailCoords.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000000'; // Theme: Line color
    ctx.lineWidth = 0.2; // Reduced line thickness

    // Draw nails
    ctx.fillStyle = '#000000'; // Theme: Nail circle fill color
    previewNailCoords.forEach(coord => {
      ctx.beginPath();
      ctx.arc(coord.x, coord.y, 2, 0, 2 * Math.PI); // Nail radius 2px
      ctx.fill(); 
    });

    // Draw lines
    drawnLines.forEach(line => {
      // Ensure line and its properties are valid, and indices are within bounds
      if (line && typeof line.from === 'number' && typeof line.to === 'number' &&
          line.from >= 0 && line.from < previewNailCoords.length && 
          line.to >= 0 && line.to < previewNailCoords.length &&
          previewNailCoords[line.from] && previewNailCoords[line.to]) {
        ctx.beginPath();
        ctx.moveTo(previewNailCoords[line.from].x, previewNailCoords[line.from].y);
        ctx.lineTo(previewNailCoords[line.to].x, previewNailCoords[line.to].y);
        ctx.stroke();
      } else {
        console.warn('Skipping drawing of invalid line:', line);
      }
    });

    // --- Add Nail Numbering Logic ---
    if (previewNailCoords.length > 0) {
      ctx.fillStyle = '#000000'; // Theme: Text color
      ctx.font = '10px Arial'; // Text font
      
      const center_x = canvas.width / 2;
      const center_y = canvas.height / 2;
      const textOffsetRadius = 10; // How far from the nail circle to place the text center

      for (let i = 0; i < previewNailCoords.length; i++) {
        if (i === 0 || i % 20 === 0) { // Display for nail 0 and every 20th nail
          const nailCoord = previewNailCoords[i];
          let textX = nailCoord.x;
          let textY = nailCoord.y;

          // Calculate angle from center to nail to position text outwards
          const angle = Math.atan2(nailCoord.y - center_y, nailCoord.x - center_x);
          
          textX += Math.cos(angle) * textOffsetRadius;
          textY += Math.sin(angle) * textOffsetRadius;

          // Adjust textAlign and textBaseline based on quadrant for better placement
          // Small epsilon for floating point comparison to center
          const epsilon = 0.1; 
          if (Math.abs(nailCoord.x - center_x) < epsilon) { // Nail is at top or bottom center
            ctx.textAlign = 'center';
            if (nailCoord.y < center_y) { // Top nail
                ctx.textBaseline = 'bottom';
                textY -= 2; // Minor adjustment to prevent overlap with nail circle
            } else { // Bottom nail
                ctx.textBaseline = 'top';
                textY += 2; // Minor adjustment
            }
          } else if (nailCoord.x < center_x) { // Left side
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            textX -= 2; // Minor adjustment
          } else { // Right side
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            textX += 2; // Minor adjustment
          }
          
          ctx.fillText(i.toString(), textX, textY);
        }
      }
    }
    // --- End Nail Numbering Logic ---

  }, [drawnLines, previewNailCoords]); // nailCount is implicitly handled as previewNailCoords depends on it


  return (
    <div 
        style={{ padding: '20px', display:'flex', gap: '20px' }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
    >
      <div style={{ flex: 1 }}>
        <h1>Create String Art</h1>
        <div style={{ marginBottom: '20px', border: '2px dashed #000000', padding: '20px', textAlign: 'center' }}> {/* Theme: Dashed border */}
          <input type="file" accept="image/png, image/jpeg" onChange={onSelectFile} />
          <p>Or drag and drop an image here</p>
        </div>

        {/* Conditional block for ReactCrop - Interactive Cropper */}
        {(!isLoading && !isAnimating && !generatedPath) && imgSrc && (
          <div style={{ marginBottom: '20px' }}>
            <h3>Crop Your Image (1:1 Aspect Ratio)</h3>
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imgSrc} // This is the grayscaled image
                onLoad={onImageLoad}
                style={{ maxHeight: '300px', objectFit: 'contain' }}
              />
            </ReactCrop>
          </div>
        )}
        
        {/* Static preview of the cropped image - THIS SHOULD ALWAYS BE VISIBLE if a crop is completed */}
        {completedCrop && imgSrc && (
          <div style={{ marginBottom: '20px', border:'1px solid #000000', padding: '10px'}}> {/* Theme: Border */}
              <h4>Your Cropped Image (Grayscaled)</h4>
              <canvas 
                  ref={previewCroppedCanvasRef}
                  style={{ border: '1px solid #000000', maxWidth: '100%', marginTop: '10px' }} /* Theme: Canvas border */
                  // Fixed size for simplicity, or dynamic based on crop
                  // width={previewCanvasSize} 
                  // height={previewCanvasSize}
              />
          </div>
        )}

        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="nailCount" style={{ marginRight: '10px' }}>Nail Count:</label>
          <input type="number" id="nailCount" value={nailCount} min="10" onChange={(e) => setNailCount(Math.max(10, parseInt(e.target.value,10) || 10))} />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="lineCount" style={{ marginRight: '10px' }}>Line Count:</label>
          <input type="number" id="lineCount" value={lineCount} min="10" onChange={(e) => setLineCount(Math.max(10, parseInt(e.target.value,10) || 10))} />
        </div>
        <button onClick={handleGenerateArt} disabled={isLoading || !completedCrop} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          {isLoading ? 'Generating...' : 'Generate String Art'}
        </button>
        {apiError && (
          <div style={{ color: 'red', marginTop: '10px', padding: '10px', border: '1px solid red', borderRadius: '4px' }}>
            <strong>Error:</strong> {apiError}
          </div>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <h2>Live Preview</h2>
        <canvas 
            ref={stringArtPreviewCanvasRef} 
            width={previewCanvasSize} 
            height={previewCanvasSize} 
            style={{ border: '1px solid #000000' }} /* Theme: Canvas border */
        />
        {isLoading && <p style={{fontWeight: 'bold'}}>Backend processing: Generating string art path... This might take a moment.</p>}
        {isAnimating && <p>Animating preview... {progressPercentage}%</p>}
        {!isLoading && !isAnimating && generatedPath && <p>Progress: {progressPercentage}% (Completed)</p>}
        <h3>Generated Path:</h3>
        <textarea 
            readOnly 
            value={generatedPath || ""} 
            style={{ width: '100%', height: '100px', marginTop: '10px', fontFamily: 'monospace' }} 
        />
      </div>
    </div>
  );
}
export default CreatePage;
