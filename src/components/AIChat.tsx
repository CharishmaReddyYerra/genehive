import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, FamilyMember, Disease } from '../types';
import { ApiService, FallbackService } from '../services/api';
import { Send, Bot, User, Loader, AlertCircle, Minimize2, Maximize2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface AIChatProps {
  familyMembers: FamilyMember[];
  diseases: Disease[];
  selectedMember: FamilyMember | null;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

const AIChat: React.FC<AIChatProps> = ({
  familyMembers,
  diseases,
  selectedMember,
  isMinimized,
  onToggleMinimize
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uuidv4(),
      type: 'ai',
      content: 'Hello! I\'m your AI genetic counselor. I can help explain genetic risks, inheritance patterns, and answer questions about your family tree. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check backend availability
    const checkBackend = async () => {
      try {
        await ApiService.healthCheck();
        setIsOnline(true);
      } catch (error) {
        setIsOnline(false);
      }
    };
    
    checkBackend();
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
        let aiResponse: string;
        
        if (isOnline) {
          // Try to use backend AI service
          const response = await ApiService.chatWithAI(userMessage.content, {
            members: familyMembers,
            diseases,
            selected_member: selectedMember || undefined
          });
          aiResponse = response.response;
        } else {
          // Use fallback service
          aiResponse = FallbackService.generateFallbackChatResponse(userMessage.content, {
            members: familyMembers,
            diseases: diseases,
            selected_member: selectedMember || undefined
          });
        }

      const aiMessage: ChatMessage = {
        id: uuidv4(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      // Fallback to local response
      const fallbackResponse = FallbackService.generateFallbackChatResponse(userMessage.content);
      const aiMessage: ChatMessage = {
        id: uuidv4(),
        type: 'ai',
        content: fallbackResponse + ' (Note: AI service is currently unavailable, using local responses)',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsOnline(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const generateQuickQuestions = () => {
    const questions = [];
    
    if (selectedMember) {
      questions.push(`What is ${selectedMember.name}'s genetic risk profile?`);
      
      if (selectedMember.diseases.length > 0) {
        questions.push(`How might ${selectedMember.name}'s conditions affect their children?`);
      }
      
      const maxRisk = Math.max(...Object.values(selectedMember.riskScores), 0);
      if (maxRisk > 0.5) {
        questions.push(`What can ${selectedMember.name} do to reduce their disease risk?`);
      }
    }
    
    if (familyMembers.length > 0) {
      questions.push('What inheritance patterns do I see in this family?');
      questions.push('Which family members should consider genetic testing?');
    }
    
    questions.push('How do dominant and recessive traits differ?');
    questions.push('What lifestyle factors can influence genetic risk?');
    
    return questions.slice(0, 3); // Show max 3 suggestions
  };

  const quickQuestions = generateQuickQuestions();

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={onToggleMinimize}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-full p-3 shadow-lg transition-colors flex items-center gap-2"
        >
          <Bot className="w-5 h-5" />
          <span className="hidden sm:inline">AI Assistant</span>
          {!isOnline && (
            <AlertCircle className="w-4 h-4 text-yellow-300" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-lg shadow-xl border z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <h3 className="font-semibold">AI Genetic Counselor</h3>
          {!isOnline && (
            <AlertCircle className="w-4 h-4 text-yellow-300" />
          )}
        </div>
        <button
          onClick={onToggleMinimize}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'ai' && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-600" />
                </div>
              </div>
            )}
            
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            
            {message.type === 'user' && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-600" />
              </div>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {quickQuestions.length > 0 && (
        <div className="px-4 py-2 border-t bg-gray-50">
          <p className="text-xs text-gray-600 mb-2">Quick questions:</p>
          <div className="space-y-1">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(question)}
                className="text-xs text-primary-600 hover:text-primary-700 block w-full text-left truncate"
                title={question}
              >
                • {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about genetic risks..."
            className="flex-1 input text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="btn-primary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        {!isOnline && (
          <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Offline mode - responses may be limited
          </p>
        )}
      </div>
    </div>
  );
};

export default AIChat;