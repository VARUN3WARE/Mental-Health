document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const connectionStatus = document.getElementById('connectionStatus');
    
    // API endpoint (update if deployed to a different URL)
    const API_ENDPOINT = 'http://127.0.0.1:5000/chat';
    
    // Check connection to API
    checkAPIConnection();
    
    // Function to check API connection
    async function checkAPIConnection() {
        try {
            // Try to ping the API
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query: "hello" })
            });
            
            if (response.ok) {
                connectionStatus.className = 'connection-status status-connected';
                connectionStatus.textContent = 'Connected to API';
            } else {
                throw new Error('API request failed');
            }
        } catch (error) {
            connectionStatus.className = 'connection-status status-disconnected';
            connectionStatus.textContent = 'API Connection Failed - Check if Flask server is running';
            console.error('API connection error:', error);
        }
    }
    
    // Function to add a message to the chat
    function addMessage(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        
        const avatar = document.createElement('div');
        avatar.classList.add('message-avatar');
        avatar.textContent = sender === 'user' ? 'You' : 'MH';
        
        const bubble = document.createElement('div');
        bubble.classList.add('message-bubble');
        bubble.textContent = message;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);
        
        chatMessages.appendChild(messageDiv);
        
        // Scroll to the bottom of the chat
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Function to display typing indicator
    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.classList.add('typing-indicator');
        indicator.id = 'typingIndicator';
        
        const avatar = document.createElement('div');
        avatar.classList.add('message-avatar');
        avatar.textContent = 'MH';
        
        const dots = document.createElement('div');
        dots.classList.add('message-bubble');
        
        const dotsInner = document.createElement('div');
        dotsInner.classList.add('dots');
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            dotsInner.appendChild(dot);
        }
        
        dots.appendChild(dotsInner);
        indicator.appendChild(avatar);
        indicator.appendChild(dots);
        
        chatMessages.appendChild(indicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Function to remove typing indicator
    function removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    // Function to send message to the API and get response
    async function sendToAPI(message) {
        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query: message })
            });
            
            if (!response.ok) {
                throw new Error('API request failed');
            }
            
            const data = await response.json();
            return data.response || "I'm sorry, I couldn't process your request at this time.";
        } catch (error) {
            console.error('Error calling API:', error);
            connectionStatus.className = 'connection-status status-disconnected';
            connectionStatus.textContent = 'API Connection Failed - Check if Flask server is running';
            return "I'm having trouble connecting to the server. Please make sure the Flask API is running at " + API_ENDPOINT;
        }
    }
    
    // Function to handle sending a message
    async function sendMessage() {
        const message = userInput.value.trim();
        
        if (message === '') {
            return;
        }
        
        // Clear input field
        userInput.value = '';
        
        // Add user message to chat
        addMessage(message, 'user');
        
        // Show typing indicator
        showTypingIndicator();
        
        try {
            // Get response from API (with a small delay to simulate thinking)
            setTimeout(async () => {
                const response = await sendToAPI(message);
                
                // Remove typing indicator
                removeTypingIndicator();
                
                // Add bot response to chat
                addMessage(response, 'bot');
                
                // Update connection status to connected
                connectionStatus.className = 'connection-status status-connected';
                connectionStatus.textContent = 'Connected to API';
            }, 1000);
        } catch (error) {
            console.error('Error:', error);
            removeTypingIndicator();
            addMessage("I'm sorry, I encountered an error. Please try again later.", 'bot');
        }
    }
    
    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Focus input field when page loads
    userInput.focus();
});
