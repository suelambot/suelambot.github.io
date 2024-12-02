document.addEventListener("DOMContentLoaded", () => {
    // Select all <code> blocks with the "language-mermaid" class
    const codeBlocks = document.querySelectorAll("code.language-mermaid");

    codeBlocks.forEach(block => {
        // Get the parent <pre> tag
        const preTag = block.parentElement;
        // Replace the <code> block's innerHTML with the diagram content
        preTag.innerHTML = block.innerHTML;
        // Add the "mermaid.js" class to the <pre> tag
        preTag.classList.add("mermaid");
    });
});