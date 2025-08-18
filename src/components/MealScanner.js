import React, { useState } from 'react';
import Tesseract from 'tesseract.js';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const MealScanner = ({ onScanComplete }) => {
    const [image, setImage] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [extractedText, setExtractedText] = useState('');
    const [detectedAllergens, setDetectedAllergens] = useState([]);

    // List of allergens to detect
    const allergensList = [
        "Milk", "Eggs", "Fish", "Crustaceans", "Molluscs", "Peanuts", "Tree Nuts",
        "Soybeans", "Sesame", "Celery", "Mustard", "Lupin", "Sulphites", "Gluten"
    ];

    // Handle file selection
    const handleFileChange = async (event) => {
        const file = event.target.files[0];

        if (file) {
            setImage(URL.createObjectURL(file)); 
            await scanImage(file);
        }
    };

    // Process OCR
    const scanImage = async (file) => {
        setScanning(true);
        try {
            // Process image with OCR
            const { data: { text } } = await Tesseract.recognize(file, 'eng');
            setExtractedText(text);
            setScanning(false);

            // Detect allergens
            const detected = allergensList.filter(allergen =>
                text.toLowerCase().includes(allergen.toLowerCase())
            );
            setDetectedAllergens(detected);

            // Send data to backend (for meals)
            await axios.post('http://localhost:5000/meals/scanned', {
                mealName: text.split("\n")[0].trim(),
                allergens: detected
            });

            toast.success("✅ Meal allergens detected and saved!");
        } catch (error) {
            console.error("❌ Error scanning meal label:", error);
            toast.error("Error scanning meal label.");
            setScanning(false);
        }
    };

    return (
        <div>
            <h3>Scan Meal Label</h3>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {image && <img src={image} alt="Meal label" width="200" />}
            {scanning && <p><span role="img" aria-label="search">🔍</span> Scanning...</p>}

            {extractedText && (
                <div>
                    <h4>Extracted Text:</h4>
                    <p>{extractedText}</p>
                    <h4>Detected Allergens:</h4>
                    <ul>
                        {detectedAllergens.length > 0 
                            ? detectedAllergens.map((allergen, index) => <li key={index}>{allergen}</li>) 
                            : <li>No allergens detected</li>}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default MealScanner;
