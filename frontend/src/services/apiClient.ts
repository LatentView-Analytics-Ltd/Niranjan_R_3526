/**
 * API client for Campaign Management backend
 */

import axios, { AxiosError } from 'axios';
import type {
  CampaignBrief,
  ClarifyingQuestionsResponse,
  QuestionAnswer,
  ExecutionPlan,
  QAReport,
  ConsistencyReport,
  ErrorResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds for AI processing
});

// Error handler
const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ErrorResponse>;
    const errorMessage = axiosError.response?.data?.error || axiosError.message || 'An unknown error occurred';
    throw new Error(errorMessage);
  }
  throw error;
};

export const api = {
  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Analyze campaign brief and get clarifying questions
   */
  async analyzeBrief(brief: CampaignBrief): Promise<ClarifyingQuestionsResponse> {
    try {
      const response = await apiClient.post<ClarifyingQuestionsResponse>('/api/analyze-brief', {
        brief,
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Generate execution plan from brief and answers
   */
  async generatePlan(brief: CampaignBrief, answers: QuestionAnswer[]): Promise<ExecutionPlan> {
    try {
      const response = await apiClient.post<ExecutionPlan>('/api/generate-plan', {
        brief,
        answers,
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Validate execution plan against brief
   */
  async validatePlan(brief: CampaignBrief, plan: ExecutionPlan): Promise<QAReport> {
    try {
      const response = await apiClient.post<QAReport>('/api/validate-plan', {
        brief,
        plan,
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Smart-fill brief fields from free-form text using AI
   */
  async smartFill(text: string): Promise<CampaignBrief> {
    try {
      const response = await apiClient.post<CampaignBrief>('/api/smart-fill', {
        text,
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Check cross-channel consistency in execution plan
   */
  async checkConsistency(plan: ExecutionPlan): Promise<ConsistencyReport> {
    try {
      const response = await apiClient.post<ConsistencyReport>('/api/check-consistency', {
        plan,
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Fix execution plan based on QA findings
   */
  async fixPlan(brief: CampaignBrief, plan: ExecutionPlan, fixes: string[]): Promise<ExecutionPlan> {
    try {
      const response = await apiClient.post<ExecutionPlan>('/api/fix-plan', {
        brief,
        plan,
        fixes,
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
};

export default api;
