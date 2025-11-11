// 챗봇 기능 구현

// 기본 시스템 프롬프트
const DEFAULT_SYSTEM_PROMPT = '당신은 친절하고 재미있는 운세 전문가입니다. 사용자의 질문에 대해 오늘의 운세를 알려주세요. 운세는 긍정적이고 희망적인 내용으로 작성하며, 때로는 유머를 섞어서 답변합니다.';

export function initChatbot() {
  const messagesContainer = document.getElementById('chatbot-messages');
  const input = document.getElementById('chatbot-input');
  const sendButton = document.getElementById('chatbot-send');
  
  // 프롬프트 테스트 관련 요소
  const promptInput = document.getElementById('prompt-input');
  const promptEditorContainer = document.getElementById('prompt-editor-container');
  const togglePromptBtn = document.getElementById('toggle-prompt');
  const resetPromptBtn = document.getElementById('reset-prompt');
  const applyPromptBtn = document.getElementById('apply-prompt');
  
  // 현재 사용 중인 시스템 프롬프트 (기본값으로 초기화)
  let currentSystemPrompt = DEFAULT_SYSTEM_PROMPT;

  // 메시지 추가 함수 (먼저 정의)
  function addMessage(type, content, isLoading = false) {
    const messageDiv = document.createElement('div');
    const messageId = `msg-${Date.now()}-${Math.random()}`;
    messageDiv.id = messageId;
    messageDiv.className = `message ${type}-message`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;

    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);

    // 스크롤을 맨 아래로
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return isLoading ? messageId : null;
  }

  // 메시지 제거 함수 (로딩 메시지용)
  function removeMessage(messageId) {
    const message = document.getElementById(messageId);
    if (message) {
      message.remove();
    }
  }

  // 프롬프트 테스트 기능 초기화 (API 키와 무관하게 먼저 초기화)
  function initPromptTest() {
    // 기본 프롬프트를 입력창에 설정
    promptInput.value = DEFAULT_SYSTEM_PROMPT;
    promptInput.placeholder = DEFAULT_SYSTEM_PROMPT;
    
    // 프롬프트 편집 영역 토글 (기본적으로 접힘)
    let isExpanded = false;
    promptEditorContainer.style.display = 'none';
    
    togglePromptBtn.addEventListener('click', () => {
      isExpanded = !isExpanded;
      promptEditorContainer.style.display = isExpanded ? 'block' : 'none';
      togglePromptBtn.textContent = isExpanded ? '프롬프트 접기' : '프롬프트 편집';
    });
    
    // 기본값으로 리셋
    resetPromptBtn.addEventListener('click', () => {
      promptInput.value = DEFAULT_SYSTEM_PROMPT;
      currentSystemPrompt = DEFAULT_SYSTEM_PROMPT;
      addMessage('bot', '✅ 프롬프트가 기본값으로 리셋되었습니다.');
    });
    
    // 프롬프트 적용
    applyPromptBtn.addEventListener('click', () => {
      const newPrompt = promptInput.value.trim();
      if (newPrompt) {
        currentSystemPrompt = newPrompt;
        addMessage('bot', '✅ 새로운 프롬프트가 적용되었습니다. 이제부터 이 프롬프트로 대화합니다.');
        console.log('프롬프트 업데이트:', currentSystemPrompt);
      } else {
        addMessage('bot', '⚠️ 프롬프트가 비어있습니다. 기본값을 사용합니다.');
        currentSystemPrompt = DEFAULT_SYSTEM_PROMPT;
        promptInput.value = DEFAULT_SYSTEM_PROMPT;
      }
    });
  }

  // 프롬프트 테스트 기능 초기화 실행
  initPromptTest();

  // API Key 가져오기 (Vite 환경 변수)
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  // 디버깅: 환경 변수 확인
  console.log('=== 환경 변수 디버깅 정보 ===');
  console.log('API Key 존재 여부:', !!apiKey);
  console.log('API Key 타입:', typeof apiKey);
  console.log('API Key 값 (처음 10자리):', apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined');
  console.log('모든 VITE_ 환경 변수:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
  console.log('import.meta.env 내용:', import.meta.env);
  console.log('================================');

  // API 키 유효성 검사
  if (!apiKey || apiKey === 'your_api_key_here' || (typeof apiKey === 'string' && apiKey.trim() === '')) {
    const errorMsg = '⚠️ API 키를 찾을 수 없습니다.\n\n📋 확인 사항:\n1. .env 파일이 프로젝트 루트에 있는지 확인\n2. .env 파일에 VITE_OPENAI_API_KEY=your_key 형식으로 작성\n3. 개발 서버를 완전히 종료 (Ctrl+C)\n4. 캐시 삭제: rm -rf node_modules/.vite\n5. 개발 서버 재시작: npm run dev\n6. 브라우저 완전 새로고침 (Cmd+Shift+R 또는 Ctrl+Shift+R)\n\n💡 중요: Vite는 서버 시작 시에만 .env를 읽습니다!';
    addMessage('error', errorMsg);
    input.disabled = true;
    sendButton.disabled = true;
    console.error('❌ API 키 로드 실패');
    console.error('현재 import.meta.env:', import.meta.env);
    console.error('VITE_ 환경 변수 목록:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
    // API 키가 없어도 프롬프트 테스트는 가능하므로 return하지 않음
  } else {
    // API 키가 로드되었음을 확인
    console.log('✅ API 키가 성공적으로 로드되었습니다!');
  }

  // 메시지 전송 함수
  async function sendMessage() {
    const userMessage = input.value.trim();
    if (!userMessage) return;

    // API 키 확인
    if (!apiKey || apiKey === 'your_api_key_here' || (typeof apiKey === 'string' && apiKey.trim() === '')) {
      addMessage('bot', '⚠️ API 키가 설정되지 않아 메시지를 보낼 수 없습니다. .env 파일에 VITE_OPENAI_API_KEY를 설정해주세요.');
      return;
    }

    // 사용자 메시지 표시
    addMessage('user', userMessage);
    input.value = '';

    // 로딩 메시지 표시
    const loadingId = addMessage('bot', '생각 중...', true);

    try {
      // OpenAI API 호출 (현재 설정된 프롬프트 사용)
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: currentSystemPrompt
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const botMessage = data.choices[0].message.content;

      // 로딩 메시지 제거하고 실제 응답 표시
      removeMessage(loadingId);
      addMessage('bot', botMessage);

    } catch (error) {
      console.error('챗봇 오류:', error);
      removeMessage(loadingId);
      addMessage('bot', `죄송합니다. 오류가 발생했습니다: ${error.message}`);
    }
  }

  // 이벤트 리스너
  sendButton.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  // 입력창 포커스
  input.focus();
}

