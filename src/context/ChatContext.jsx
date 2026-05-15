// src/context/ChatContext.jsx
import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { chatApi } from "../utils/api";
import { useAuth } from "./AuthContext";

// ─── STATE ────────────────────────────────────────────────────────────────────
const initialState = {
  conversations: [],
  activeConversation: null,
  messages: [],
  isStreaming: false,
  streamingContent: "",
  isLoadingConversations: false,
  isLoadingMessages: false,
  isSending: false,
  error: null,
  pagination: { page: 1, total: 0, pages: 1 },
};

// ─── REDUCER ──────────────────────────────────────────────────────────────────
function chatReducer(state, action) {
  switch (action.type) {
    case "SET_CONVERSATIONS":
      return {
        ...state,
        conversations: action.payload.conversations,
        pagination: action.payload.pagination,
        isLoadingConversations: false,
      };
    case "ADD_CONVERSATION":
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
        activeConversation: action.payload,
        messages: [],
      };
    case "UPDATE_CONVERSATION":
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c._id === action.payload._id ? { ...c, ...action.payload } : c
        ),
        activeConversation:
          state.activeConversation?._id === action.payload._id
            ? { ...state.activeConversation, ...action.payload }
            : state.activeConversation,
      };
    case "DELETE_CONVERSATION":
      return {
        ...state,
        conversations: state.conversations.filter((c) => c._id !== action.payload),
        activeConversation:
          state.activeConversation?._id === action.payload ? null : state.activeConversation,
        messages: state.activeConversation?._id === action.payload ? [] : state.messages,
      };
    case "SET_ACTIVE_CONVERSATION":
      return {
        ...state,
        activeConversation: action.payload.conversation,
        messages: action.payload.messages,
        isLoadingMessages: false,
      };
    case "LOADING_CONVERSATIONS":
      return { ...state, isLoadingConversations: true };
    case "LOADING_MESSAGES":
      return { ...state, isLoadingMessages: true };

    // Optimistic: add user message immediately
    case "ADD_USER_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload],
        isSending: true,
        isStreaming: true,
        streamingContent: "",
      };
    // Accumulate streaming deltas
    case "STREAM_DELTA":
      return { ...state, streamingContent: state.streamingContent + action.payload };
    // Finalise stream: replace streaming content with saved message
    case "STREAM_DONE": {
      const assistantMessage = {
        _id: action.payload.messageId,
        role: "assistant",
        content: state.streamingContent,
        tokensUsed: action.payload.tokensUsed,
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        messages: [...state.messages, assistantMessage],
        isStreaming: false,
        streamingContent: "",
        isSending: false,
      };
    }
    // User manually stopped stream — preserve partial content
    case "STOP_STREAM": {
      if (!state.streamingContent) {
        return { ...state, isStreaming: false, isSending: false };
      }
      const partialMessage = {
        _id: `partial_${Date.now()}`,
        role: "assistant",
        content: state.streamingContent + " _(stopped)_",
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        messages: [...state.messages, partialMessage],
        isStreaming: false,
        streamingContent: "",
        isSending: false,
      };
    }
    case "STREAM_ERROR":
      return {
        ...state,
        isStreaming: false,
        streamingContent: "",
        isSending: false,
        error: action.payload,
      };
    case "SET_ERROR":
      return { ...state, error: action.payload, isSending: false, isStreaming: false };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "RESET_CHAT":
      return { ...initialState };
    default:
      return state;
  }
}

// ─── CONTEXT ──────────────────────────────────────────────────────────────────
const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { updateUser } = useAuth();
  const cancelStreamRef = useRef(null);

  // ─── LOAD CONVERSATIONS ───────────────────────────────────────────────────
  const loadConversations = useCallback(async (params = {}) => {
    dispatch({ type: "LOADING_CONVERSATIONS" });
    try {
      const { data } = await chatApi.getConversations(params);
      dispatch({ type: "SET_CONVERSATIONS", payload: data.data });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
    }
  }, []);

  // ─── OPEN CONVERSATION ────────────────────────────────────────────────────
  const openConversation = useCallback(async (id) => {
    dispatch({ type: "LOADING_MESSAGES" });
    try {
      const { data } = await chatApi.getConversation(id);
      dispatch({ type: "SET_ACTIVE_CONVERSATION", payload: data.data });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
    }
  }, []);

  // ─── NEW CONVERSATION ─────────────────────────────────────────────────────
  const newConversation = useCallback(async (options = {}) => {
    try {
      const { data } = await chatApi.createConversation(options);
      dispatch({ type: "ADD_CONVERSATION", payload: data.data.conversation });
      return data.data.conversation;
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
    }
  }, []);

  // ─── RENAME CONVERSATION ──────────────────────────────────────────────────
  const renameConversation = useCallback(async (id, title) => {
    try {
      const { data } = await chatApi.updateConversation(id, { title });
      dispatch({ type: "UPDATE_CONVERSATION", payload: data.data.conversation });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
    }
  }, []);

  // ─── DELETE CONVERSATION ──────────────────────────────────────────────────
  const deleteConversation = useCallback(async (id) => {
    try {
      await chatApi.deleteConversation(id);
      dispatch({ type: "DELETE_CONVERSATION", payload: id });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
    }
  }, []);

  // ─── SEND MESSAGE (STREAMING) ─────────────────────────────────────────────
  const activeConversationRef = useRef(null);

  // Keep ref in sync with state
  useEffect(() => {
    activeConversationRef.current = state.activeConversation;
  }, [state.activeConversation]);

  const sendMessage = useCallback(
    async (content, options = {}) => {
      const {
        model = "gpt-4o-mini",
        conversationId = activeConversationRef.current?._id,
      } = options;

      // Optimistic user message
      const tempUserMsg = {
        _id: `temp_${Date.now()}`,
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: "ADD_USER_MESSAGE", payload: tempUserMsg });

      let resolvedConversationId = conversationId;

      // Cancel previous stream if any
      cancelStreamRef.current?.();

      const cancel = chatApi.sendMessageStream(
        { message: content, conversationId, model, stream: true },
        {
          onStart: (data) => {
            resolvedConversationId = data.conversationId;
            // If new conversation, refresh sidebar
            if (!conversationId) {
              loadConversations();
            }
          },
          onDelta: (chunk) => {
            dispatch({ type: "STREAM_DELTA", payload: chunk });
          },
          onDone: (data) => {
            dispatch({ type: "STREAM_DONE", payload: data });
            // Use ref to read current messageCount (avoids stale closure)
            dispatch({
              type: "UPDATE_CONVERSATION",
              payload: {
                _id: resolvedConversationId,
                lastMessageAt: new Date().toISOString(),
                messageCount: (activeConversationRef.current?.messageCount || 0) + 2,
              },
            });
            updateUser({ credits: data.creditsRemaining });
          },
          onError: (err) => {
            dispatch({ type: "STREAM_ERROR", payload: err?.message || null });
          },
        }
      );

      cancelStreamRef.current = cancel;
    },
    [loadConversations, updateUser] // removed state.activeConversation — now read via ref
  );

  // ─── STOP STREAM ─────────────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    cancelStreamRef.current?.();
    // Save whatever partial content was streamed as an incomplete message
    dispatch({ type: "STOP_STREAM" });
  }, []);

  const clearError = useCallback(() => dispatch({ type: "CLEAR_ERROR" }), []);

  const value = {
    ...state,
    loadConversations,
    openConversation,
    newConversation,
    renameConversation,
    deleteConversation,
    sendMessage,
    stopStream,
    clearError,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside <ChatProvider>");
  return ctx;
};