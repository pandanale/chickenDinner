document.getElementById('pepperButton').addEventListener('click', makePeppersFall);

function makePeppersFall() {
    const container = document.getElementById('pepperContainer');
    for (let i = 0; i < 20; i++) { // Adjust the number of peppers as needed
        const pepper = document.createElement('span');
        pepper.className = 'pepper';
        pepper.textContent = '🌶️';
        pepper.style.left = Math.random() * 100 + 'vw';
        pepper.style.animationDuration = (Math.random() * 2 + 3) + 's'; // Random duration between 3s and 5s
        pepper.style.fontSize = (Math.random() * 10 + 20) + 'px'; // Random font size between 20px and 30px
        
        container.appendChild(pepper);

        // Remove the pepper after it's fallen
        setTimeout(() => {
            if (container.contains(pepper)) {
                container.removeChild(pepper);
            }
        }, 5000);
    }
}