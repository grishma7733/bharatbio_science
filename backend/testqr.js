const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const testQR = async () => {
    try {
        const url = "https://example.com";
        console.log("Testing QR Code generation for:", url);

        const qrCode = await QRCode.toDataURL(url);
        console.log("QR Code Generated Successfully");

        const qrCodesDir = path.join(__dirname, 'qrcodes');
        if (!fs.existsSync(qrCodesDir)) {
            fs.mkdirSync(qrCodesDir, { recursive: true });
            console.log("Created 'qrcodes' directory");
        }

        const base64Data = qrCode.replace(/^data:image\/png;base64,/, "");
        const filePath = path.join(qrCodesDir, `test_qr.png`);
        fs.writeFileSync(filePath, base64Data, 'base64');

        console.log("Test QR Code saved successfully at:", filePath);
    } catch (err) {
        console.error("QR Code Generation Failed:", err.message, err.stack);
    }
};

testQR();
