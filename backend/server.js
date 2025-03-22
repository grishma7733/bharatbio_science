const express = require('express');
const { Client } = require('pg');
const cors = require('cors');
const path = require('path');
const QRCode = require('qrcode');
const fs = require('fs');
require('dotenv').config();

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || "https://bharatbio-science.vercel.app";
app.use(express.static(path.join(__dirname, 'public')));

const apiRoutes = require("./routes/apiRoutes"); // Ensure this matches the correct file path
app.use("/api", apiRoutes);




app.use(express.json());

app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));

app.use((req, res, next) => {
    const frontendUrl = process.env.FRONTEND_URL || 'https://bharatbio-science.vercel.app';
    const backendUrl = process.env.BACKEND_URL || 'https://bharatbioscience.com';

    const cspHeader = "default-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; " +
                      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                      "script-src 'self'; " +
                      "img-src 'self' data: https:; " +
                      `connect-src 'self' ${frontendUrl} ${backendUrl}`;

    console.log("CSP Header:", cspHeader); // Debugging step

    res.setHeader("Content-Security-Policy", cspHeader);
    next();
});

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/qrcodes', express.static('qrcodes'));

app.get("/", (req, res) => {
    res.send("Server is running! QR Code API is working.");
});

const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});

// const client = new Client({
//     connectionString: process.env.DB_URL,
//     ssl: { rejectUnauthorized: false } // Required for Supabase
// });

client.connect()
    .then(() => console.log('Connected to Supabase Database'))
    .catch(err => console.error('Connection error', err.stack));

    app.get("/api/product/:productName", async (req, res) => {
        const { productName } = req.params;
        const decodedName = decodeURIComponent(productName).replace(/_/g, " ").trim();

        if (!decodedName) {
            console.log("[LOG] Invalid product name received.");
            return res.status(400).json({ success: false, error: "Invalid product name" });
        }
    
        console.log(`[LOG] Received request for product name: ${decodedName}`);
    
        try {
            const result = await client.query("SELECT * FROM product_details WHERE LOWER(TRIM(product_name)) = LOWER(TRIM($1))", [decodedName]);
            console.log("Decoded product name:", decodedName);
            console.log("Query result:", result.rows);
            const rows = result.rows;
    
            if (!rows || rows.length === 0) {
                console.log("[LOG] Product not found in database.");
                return res.status(404).json({ error: "Product not found" });
            }
    
            const product = rows[0];
            const response = {
                product_name: product.product_name,
                product_image_url: product.product_image_url,
                batch_no: product.batch_no,
                manufacturing_date: product.manufacturing_date,
                expiration_date: product.expiration_date,
                mrp: product.mrp,
                registration_no: product.registration_no,
                manufacturer: product.manufacturer,
                marketed_by: product.marketed_by,
                antidote_statement: product.antidote_statement,
                email: product.email,
                phone_no: product.phone_no,
                address: product.address,
                leaflet_link: product.leaflet_link,
                label_link: product.label_link
            };
            
            console.log("[LOG] Sending product data:", response);
            res.json(response);
    
        } catch (err) {
            console.error("[ERROR] Database error:", err);
            res.status(500).json({ error: "Database error" });
        }
    });
    app.get("/view/product/:productName", async (req, res) => {
        const { productName } = req.params;
        const decodedName = decodeURIComponent(productName).trim().replace(/^:/, '');
    
        console.log(`[LOG] Raw productName: ${productName}`);
        console.log(`[LOG] Decoded productName: ${decodedName}`);
    
        try {
            const result = await client.query("SELECT * FROM product_details WHERE product_name = $1", [decodedName]);
            const rows = result.rows;
    
            if (!rows || rows.length === 0) {
                console.log(`[LOG] Product '${decodedName}' not found in database.`);
                return res.status(404).json({ error: "Product not found" });
            }
    
            console.log("[LOG] Redirecting to frontend for product:", decodedName);
            res.redirect(`${FRONTEND_URL}/view/product/${encodeURIComponent(decodedName)}`);

    
        } catch (err) {
            console.error("[ERROR] Database error:", err);
            res.status(500).json({ error: "Database error" });
        }
    });

    app.get("/test-db", async (req, res) => {
        try {
            const result = await client.query("SELECT current_database() AS db_name;");
            console.log("[DB TEST] Connected to database:", result.rows[0].db_name);
            res.json({ success: true, database: result.rows[0].db_name });
        } catch (err) {
            console.error("[DB TEST] Connection failed:", err);
            res.status(500).json({ success: false, error: "Database connection failed", details: err.message });
        }
    });
    
    
    app.get('/api/generate-qr/:productName/save', async (req, res) => {
        let { productName } = req.params;
        
        // ✅ Remove invalid characters (like `:`) and replace spaces with `_`
        const safeProductName = decodeURIComponent(productName.trim().replace(/\s+/g, "_").replace(/^:/, ''));
        const qrUrl = `${FRONTEND_URL}/view/product/${safeProductName}`; // Keep spaces

    
        try {
            const qrCode = await QRCode.toDataURL(qrUrl);
            const qrCodesDir = path.join(__dirname, 'qrcodes');
    
            if (!fs.existsSync(qrCodesDir)) fs.mkdirSync(qrCodesDir, { recursive: true });
    
            const filePath = path.join(qrCodesDir, `qrcode_${safeProductName}.png`);
            const base64Data = qrCode.replace(/^data:image\/png;base64,/, "");
            fs.writeFileSync(filePath, base64Data, 'base64');
    
            console.log("[LOG] QR Code saved at:", filePath);
            const fileUrl = `${process.env.BACKEND_URL}/qrcodes/qrcode_${safeProductName}.png`;
            res.json({ message: "QR Code saved!", file: fileUrl });
    
        } catch (err) {
            console.error("[ERROR] QR Code Generation Failed:", err.message);
            res.status(500).json({ error: `QR Code generation failed: ${err.message}` });
        }
    });

// app.get("*", (req, res, next) => {
//     if (req.path.startsWith("/api")) {
//         return res.status(404).json({ error: "API route not found" });
//     }
//     res.sendFile(path.join(__dirname, "public", "index.html"));
// })

const PORT = process.env.PORT || 3998;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));