document.addEventListener("DOMContentLoaded", async function () {
    try {
        // Get product ID from URL
        const pathSegments = window.location.pathname.split('/');
        const productId = pathSegments[pathSegments.length - 1];

        console.log("Current URL:", window.location.href);
        console.log("Extracted Product ID:", productId);

        // Validate product ID
        if (!productId || isNaN(productId)) {
            throw new Error("Invalid or missing product ID");
        }

        console.log("Fetching product:", productId);
        const API_BASE_URL = "https://bharatbioscience.com";
        const API_URL = `${API_BASE_URL}/view/product/${productId}`;

        console.log("Fetching product details from:", API_URL);

        // Fetch product details
        const response = await fetch(API_URL);

        if (!response.ok) {
            console.error("API Error:", response.status, response.statusText);
            throw new Error(`Error: ${response.statusText}`);
        }

        const product = await response.json();

        if (!product || Object.keys(product).length === 0) {
            throw new Error("Product not found or API returned empty data");
        }

        console.log("Product Data:", product);

        // Update HTML elements
        document.getElementById("product-name").textContent = product.product_name;
        document.getElementById("product-image").src = product.product_image_url;
        document.getElementById("batch-no").textContent = product.batch_no;
        document.getElementById("manufacturing-date").textContent = product.manufacturing_date;
        document.getElementById("expiration-date").textContent = product.expiration_date;
        document.getElementById("mrp").textContent = product.mrp;
        document.getElementById("registration-no").textContent = product.registration_no;
        document.getElementById("manufacturer").textContent = product.manufacturer;
        document.getElementById("marketed-by").textContent = product.marketed_by;
        document.getElementById("antidote-statement").textContent = product.antidote_statement || "N/A";
        document.getElementById("email").textContent = product.email || "N/A";
        document.getElementById("phone").textContent = product.phone_no || "N/A";
        document.getElementById("address").textContent = product.address || "N/A";

        document.getElementById("leaflet-link").href = product.leaflet_link || "#";
        document.getElementById("label-link").href = product.label_link || "#";

    } catch (error) {
        console.error("Error:", error);
        document.body.innerHTML = `<h2>Error loading product details</h2><p>${error.message}</p>`;
    }
});
