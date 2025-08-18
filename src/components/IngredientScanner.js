import React, { useState } from 'react';
import Tesseract from 'tesseract.js';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const IngredientScanner = ({ onScanComplete }) => {
    const [image, setImage] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [extractedText, setExtractedText] = useState('');
    const [detectedAllergens, setDetectedAllergens] = useState([]);
    const [detectedIngredients, setDetectedIngredients] = useState([]);

    // ✅ List of allergens to detect
    const allergensList = [
        "Milk", "Eggs", "Fish", "Crustaceans", "Molluscs", "Peanuts", "Tree Nuts",
        "Soybeans", "Sesame", "Celery", "Mustard", "Lupin", "Sulphites", "Gluten"
    ];

    // ✅ Common ingredient keywords
    const ingredientKeywords = [
        "flour", "sugar", "oil", "salt", "yeast", "seed", "milk", "butter",
        "egg", "nut", "cheese", "tomato", "onion", "garlic", "pepper", "pasta",
        "cream", "vanilla", "chocolate", "crustacean", "fish", "sesame", "wheat",
        "corn", "soy", "mustard", "celery", "lupin", "sulphites", "calcium",
        "iron", "niacin"
    ];

    // ✅ Function to clean extracted text
    const cleanText = (text) => {
        return text
            .replace(/[^a-zA-Z0-9,.\s-]/g, '')  // Remove unwanted symbols
            .replace(/\s+/g, ' ')  // Remove extra spaces
            .trim();
    };

    // ✅ Handle file selection
    const handleFileChange = async (event) => {
        const file = event.target.files[0];

        if (file) {
            setImage(URL.createObjectURL(file)); 
            await scanImage(file);
        }
    };

    // ✅ Scan image and extract text
    const scanImage = async (file) => {
        setScanning(true);
        let processedFile = file;
    
        // Convert HEIC if needed
        if (file.name.toLowerCase().endsWith(".heic")) {
            try {
                const formData = new FormData();
                formData.append("image", file);
    
                const response = await axios.post("http://localhost:5000/convert-heic", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });

                if (response.data && response.data.convertedImageUrl) {
                    processedFile = response.data.convertedImageUrl;
                } else {
                    throw new Error("HEIC conversion failed.");
                }
            } catch (error) {
                console.error("❌ HEIC conversion error:", error);
                toast.error("Error converting HEIC image.");
                setScanning(false);
                return;
            }
        }

        try {
            // ✅ Perform OCR on the processed image
            const { data: { text } } = await Tesseract.recognize(processedFile, 'eng');
            
            const cleanedText = cleanText(text);
            setExtractedText(cleanedText);

            // ✅ Detect allergens
            const detectedAllergens = allergensList.filter(allergen =>
                cleanedText.toLowerCase().includes(allergen.toLowerCase())
            );
            setDetectedAllergens(detectedAllergens);

            // ✅ Extract ingredient names
            const detectedIngredients = cleanedText
                .split(/\s+/)
                .filter(word => ingredientKeywords.includes(word.toLowerCase()));

            const uniqueIngredients = [...new Set(detectedIngredients)].map(name => ({
                name: name,
                amount: 100
            }));
            setDetectedIngredients(uniqueIngredients);

            // ✅ Send data to backend
            await axios.post('http://localhost:5000/ingredients/scanned', {
                ingredientName: cleanedText.split("\n")[0].trim(),
                allergens: detectedAllergens,
                ingredients: uniqueIngredients
            });

            // ✅ Pass data to parent component
            if (onScanComplete) {
                onScanComplete({ extractedText: cleanedText, detectedAllergens, detectedIngredients: uniqueIngredients });
            }

            toast.success("✅ Scanning complete!");
        } catch (error) {
            console.error("❌ Error scanning ingredient:", error);
            toast.error("Error scanning ingredient. Please try again.");
        } finally {
            setScanning(false);
        }
    };

    return (
        <div>
            <h3>Scan Ingredient Label</h3>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {image && <img src={image} alt="Ingredient label" width="200" />}
            {scanning && <p><span role="img" aria-label="search">🔍</span> Scanning...</p>}

            {extractedText && (
                <div>
                    <h4>Extracted Text:</h4>
                    <p>{extractedText}</p>
                </div>
            )}

            {detectedAllergens.length > 0 && (
                <div>
                    <h4>Detected Allergens:</h4>
                    <ul>
                        {detectedAllergens.map((allergen, index) => <li key={index}>{allergen}</li>)}
                    </ul>
                </div>
            )}

            {detectedIngredients.length > 0 && (
                <div>
                    <h4>Detected Ingredients:</h4>
                    <ul>
                        {detectedIngredients.map((ingredient, index) => (
                            <li key={index}>{ingredient.name} - {ingredient.amount}g</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default IngredientScanner;
