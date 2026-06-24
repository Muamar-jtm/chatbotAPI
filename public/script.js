const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

// Maintain conversation history for API requests
let conversationHistory = [];

// Limit conversation history to prevent token waste (max 20 messages = ~10 exchanges)
const MAX_CONVERSATION_MESSAGES = 15;

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

  // Keep conversation history within limit to save tokens
  trimConversationHistory();

  // Show temporary loading message with spinner icon
  const thinkingElement = appendMessage('bot', '', true);

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

    // Replace thinking message with AI response (formatted as paragraphs)
    const formattedResponse = formatResponse(aiResponse);
    thinkingElement.innerHTML = formattedResponse;

    // Add AI response to conversation history
    conversationHistory.push({ role: 'model', text: aiResponse });

    // Keep conversation history within limit to save tokens
    trimConversationHistory();
  } catch (error) {
    console.error('Chat error:', error);

    // Replace thinking message with error message
    const errorMessage =
      error.message.includes('Failed to fetch') ||
      error.message.includes('Network')
        ? 'Maaf, tidak ada respons. Silahkan periksa koneksi internet Anda.'
        : 'Sepertinya saya tidak tahu. Silahkan ubah pertanyaan Anda atau hubungi tim marketing kami.';

    thinkingElement.innerHTML = `<p>${escapeHtml(errorMessage)}</p>`;
  }
});

function appendMessage(sender, text, isLoading = false) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);

  if (isLoading) {
    // Create loading spinner
    const spinner = document.createElement('div');
    spinner.classList.add('loading');
    msg.appendChild(spinner);
  } else {
    msg.textContent = text;
  }

  chatBox.appendChild(msg);

  // Auto-scroll to latest message
  chatBox.scrollTop = chatBox.scrollHeight;

  // Return element for later updates (e.g., replacing thinking message)
  return msg;
}

function formatResponse(text) {
  // Split response by double newlines or numbered points
  const paragraphs = text
    .split(/\n\n+|(?=\d+\.)/) // Split by double newlines or numbered points
    .map((para) => para.trim())
    .filter((para) => para.length > 0);

  // Escape HTML and wrap in <p> tags
  return paragraphs
    .map((para) => `<p>${escapeHtml(para)}</p>`)
    .join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function trimConversationHistory() {
  // If conversation exceeds max messages, remove oldest messages
  if (conversationHistory.length > MAX_CONVERSATION_MESSAGES) {
    conversationHistory = conversationHistory.slice(
      conversationHistory.length - MAX_CONVERSATION_MESSAGES
    );
  }
}
