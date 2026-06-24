const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

// Maintain conversation history for API requests
let conversationHistory = [];

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // Add user message to chat UI
  appendMessage('user', userMessage);
  input.value = '';
  input.focus();

  // Add user message to conversation history
  conversationHistory.push({ role: 'user', text: userMessage });

  // Show temporary thinking message
  const thinkingElement = appendMessage('bot', 'Thinking...');

  try {
    // Send request to backend API
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation: conversationHistory,
      }),
    });

    // Handle HTTP errors
    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Validate response contains result
    if (!data.result) {
      throw new Error('No result received from server');
    }

    const aiResponse = data.result;

    // Replace thinking message with AI response
    thinkingElement.textContent = aiResponse;

    // Add AI response to conversation history
    conversationHistory.push({ role: 'model', text: aiResponse });
  } catch (error) {
    console.error('Chat error:', error);

    // Replace thinking message with error message
    const errorMessage =
      error.message.includes('Failed to fetch') ||
      error.message.includes('Network')
        ? 'Sorry, no response received. Please check your connection.'
        : 'Sorry, failed to get response from server.';

    thinkingElement.textContent = errorMessage;
  }
});

function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.textContent = text;
  chatBox.appendChild(msg);

  // Auto-scroll to latest message
  chatBox.scrollTop = chatBox.scrollHeight;

  // Return element for later updates (e.g., replacing thinking message)
  return msg;
}
