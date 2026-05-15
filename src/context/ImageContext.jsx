// src/context/ImageContext.jsx
import { createContext, useContext, useReducer, useCallback } from "react";
import { imageApi } from "../utils/api";
import { useAuth } from "./AuthContext";

const initialState = {
  images: [],
  isGenerating: false,
  isLoadingHistory: false,
  error: null,
  pagination: { page: 1, total: 0, pages: 1 },
};

function imageReducer(state, action) {
  switch (action.type) {
    case "GENERATING":
      return { ...state, isGenerating: true, error: null };
    case "GENERATION_SUCCESS":
      return {
        ...state,
        isGenerating: false,
        images: [...action.payload, ...state.images],
      };
    case "GENERATION_ERROR":
      return { ...state, isGenerating: false, error: action.payload };
    case "LOADING_HISTORY":
      return { ...state, isLoadingHistory: true };
    case "SET_HISTORY":
      return {
        ...state,
        images:
          action.payload.pagination.page === 1
            ? action.payload.images
            : [...state.images, ...action.payload.images],
        pagination: action.payload.pagination,
        isLoadingHistory: false,
      };
    case "DELETE_IMAGE":
      return { ...state, images: state.images.filter((img) => img._id !== action.payload) };
    case "SET_ERROR":
      return { ...state, error: action.payload, isGenerating: false };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
}

const ImageContext = createContext(null);

export function ImageProvider({ children }) {
  const [state, dispatch] = useReducer(imageReducer, initialState);
  const { updateUser } = useAuth();

  const generateImage = useCallback(async (params) => {
    dispatch({ type: "GENERATING" });
    try {
      const { data } = await imageApi.generate(params);
      dispatch({ type: "GENERATION_SUCCESS", payload: data.data.images });
      updateUser({ credits: data.data.creditsRemaining });
      return { success: true, images: data.data.images };
    } catch (err) {
      const errorMsg =
        err.code === "CONTENT_POLICY_VIOLATION"
          ? "Your prompt violates content policy. Please revise."
          : err.code === "INSUFFICIENT_CREDITS"
          ? `Not enough credits. Need ${err.required}, have ${err.credits}.`
          : err.message;
      dispatch({ type: "GENERATION_ERROR", payload: errorMsg });
      return { success: false, error: errorMsg };
    }
  }, [updateUser]);

  const loadHistory = useCallback(async (page = 1) => {
    dispatch({ type: "LOADING_HISTORY" });
    try {
      const { data } = await imageApi.getHistory({ page, limit: 12 });
      dispatch({ type: "SET_HISTORY", payload: data.data });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
    }
  }, []);

  const deleteImage = useCallback(async (id) => {
    try {
      await imageApi.deleteImage(id);
      dispatch({ type: "DELETE_IMAGE", payload: id });
      return { success: true };
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
      return { success: false, error: err.message };
    }
  }, []);

  const clearError = useCallback(() => dispatch({ type: "CLEAR_ERROR" }), []);

  return (
    <ImageContext.Provider
      value={{ ...state, generateImage, loadHistory, deleteImage, clearError }}
    >
      {children}
    </ImageContext.Provider>
  );
}

export const useImage = () => {
  const ctx = useContext(ImageContext);
  if (!ctx) throw new Error("useImage must be used inside <ImageProvider>");
  return ctx;
};