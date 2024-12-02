import React, { useState, useRef, useEffect } from 'react';
// import { createWorker, createScheduler } from 'tesseract.js';
import ollama from 'ollama';

const WaterMineralOCRApp = () => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [extractedMinerals, setExtractedMinerals] = useState({
    bicarbonate: '',
    calcium: '',
    magnesium: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Styles (inline to avoid external dependencies)
  const styles = {
    container: {
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
      textAlign: 'center'
    },
    videoContainer: {
      position: 'relative',
      width: '100%',
      backgroundColor: '#f0f0f0',
      borderRadius: '8px',
      overflow: 'hidden',
      marginBottom: '20px'
    },
    video: {
      width: '100%',
      maxHeight: '480px',
      objectFit: 'contain'
    },
    canvas: {
      display: 'none'
    },
    button: {
      padding: '10px 15px',
      margin: '10px 5px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer'
    },
    buttonDisabled: {
      backgroundColor: '#cccccc',
      cursor: 'not-allowed'
    },
    resultContainer: {
      marginTop: '20px',
      padding: '15px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px'
    },
    resultItem: {
      margin: '10px 0'
    },
    rawText: {
      backgroundColor: 'white',
      padding: '10px',
      borderRadius: '5px',
      maxHeight: '200px',
      overflowY: 'auto',
      textAlign: 'left',
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word'
    }
  };

  // Start camera stream
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  // Capture image from video stream
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, 640, 480);
      const imageDataUrl = canvasRef.current.toDataURL('image/jpeg');
      setCapturedImage(imageDataUrl);
      
      // Stop video stream
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

    // Perform OCR on captured image using Tesseract worker
    const performOCR = async () => {
        if (!capturedImage) return;

        setIsProcessing(true);
        
        const imageBase64 = capturedImage.split(',')[1];
        const response = await ollama.chat({
            model: 'llama3.2-vision',
            messages: [{
            role: 'user',
            content: 'Gere uma tabela da composição química da agua',
            images: [imageBase64]
            }]
        })

        const ocrText = response.message.content;

        setOcrResult(ocrText);
        extractMineralData(ocrText);
        setIsProcessing(false);
    };

  // Extract specific mineral data from OCR text
  const extractMineralData = (ocrText) => {
    // Convert to lowercase for case-insensitive matching
    const lowerText = ocrText.toLowerCase();
    
    // Regular expressions to extract mineral values
    const extractValue = (mineral) => {
      // Look for patterns like "Calcium: 50mg" or "Magnesium 30mg"
      const regex = new RegExp(`${mineral}\\s*[:]?\\s*(\\d+)\\s*(mg)?`, 'i');
      const match = lowerText.match(regex);
      return match ? match[1] : 'Not found';
    };

    // Update extracted minerals
    setExtractedMinerals({
      bicarbonate: extractValue('Bicarbonato'),
      calcium: extractValue('Cálcio'),
      magnesium: extractValue('Magnésio')
    });
  };

  // Reset capture process
  const resetCapture = () => {
    setCapturedImage(null);
    setOcrResult(null);
    setExtractedMinerals({
      bicarbonate: '',
      calcium: '',
      magnesium: ''
    });
    startCamera();
  };

  // Initial camera start
  useEffect(() => {
    startCamera();
  }, []);

  return (
    <div style={styles.container}>
      <h1>Water Mineral OCR Capture</h1>
      
      {/* Camera Preview */}
      {!capturedImage && (
        <div style={styles.videoContainer}>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            style={styles.video}
          />
          <button 
            onClick={captureImage} 
            style={styles.button}
          >
            Capture Image
          </button>
        </div>
      )}

      <canvas 
        ref={canvasRef} 
        width="640" 
        height="480" 
        style={styles.canvas}
        />

      {/* Captured Image */}
      {capturedImage && (
        <div>
          <img 
            src={capturedImage} 
            alt="Captured" 
            style={styles.video}
          />
          
          <div>
            <button 
              onClick={resetCapture} 
              style={styles.button}
            >
              Retake
            </button>
            <button 
              onClick={performOCR} 
              style={{
                ...styles.button,
                ...(isProcessing ? styles.buttonDisabled : {})
              }}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Perform OCR'}
            </button>
          </div>
        </div>
      )}

      {/* OCR Results */}
      {ocrResult && (
        <div style={styles.resultContainer}>
          <h3>Extracted Minerals</h3>
          <div style={styles.resultItem}>
            <strong>Bicarbonate:</strong> {extractedMinerals.bicarbonate} mg
          </div>
          <div style={styles.resultItem}>
            <strong>Calcium:</strong> {extractedMinerals.calcium} mg
          </div>
          <div style={styles.resultItem}>
            <strong>Magnesium: </strong> {extractedMinerals.magnesium} mg
            </div>
        <h3>Raw OCR Text</h3>
        <div style={styles.rawText}>{ocrResult}</div>
        </div>
    )}
    </div>
  );
};

export default WaterMineralOCRApp;