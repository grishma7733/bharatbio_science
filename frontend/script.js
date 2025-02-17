const API_BASE_URL = "https://bharatbioscience.com";
document.addEventListener("DOMContentLoaded", async function () {
    try {
        // Get product ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id'); // Get the product ID from ?id=1

if (!productId) {
    throw new Error("Invalid or missing product ID");
}


        if (!productId || isNaN(productId)) {
            throw new Error("Invalid or missing product ID");
        }

        console.log("Fetching product:", productId);

        // Fetch product details
        const response = await fetch(`${API_BASE_URL}/api/product/${productId}`);
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const product = await response.json();
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
